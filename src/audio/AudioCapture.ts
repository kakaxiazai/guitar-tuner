import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/** AudioCapture 配置 */
export interface AudioCaptureConfig {
  sampleRate: number;       // 采样率，默认 44100
  numberOfChannels: number; // 声道数，默认 1（单声道）
  bitDepth: number;         // 位深度，默认 16
  segmentDurationMs: number;// 每段录制时长（毫秒），默认 100
  isMeteringEnabled: boolean; // 是否启用音量计量，默认 true
}

/** AudioCapture 事件回调 */
export interface AudioCaptureCallbacks {
  /** 每次获取到音频数据时回调，参数为 Float32Array */
  onAudioData: (data: Float32Array) => void;
  /** 音量变化回调，值为 -160 到 0 dBFS */
  onAudioLevel?: (level: number) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/** AudioCapture 状态 */
export type AudioCaptureState = 'idle' | 'requesting_permission' | 'preparing' | 'recording' | 'stopped' | 'error';

export class AudioCapture {
  private recording: Audio.Recording | null = null;
  private config: AudioCaptureConfig;
  private callbacks: AudioCaptureCallbacks;
  private state: AudioCaptureState = 'idle';
  private recordingUri: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  constructor(config?: Partial<AudioCaptureConfig>, callbacks?: AudioCaptureCallbacks) {
    this.config = {
      sampleRate: 44100,
      numberOfChannels: 1,
      bitDepth: 16,
      segmentDurationMs: 100,
      isMeteringEnabled: true,
      ...config,
    };
    this.callbacks = callbacks || { onAudioData: () => {} };
  }

  /** 获取当前状态 */
  getState(): AudioCaptureState {
    return this.state;
  }

  /** 更新回调 */
  setCallbacks(callbacks: AudioCaptureCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 请求麦克风权限
   * Android: 使用 expo-av 的 requestPermissionsAsync（app.json 已配置 RECORD_AUDIO）
   * iOS: 使用 expo-av 的 requestPermissionsAsync（app.json 已配置 NSMicrophoneUsageDescription）
   */
  async requestPermission(): Promise<boolean> {
    this.state = 'requesting_permission';
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      this.state = granted ? 'idle' : 'error';
      return granted;
    } catch (error) {
      this.state = 'error';
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 开始音频采集（循环录制模式）
   */
  async start(): Promise<boolean> {
    if (this.isDestroyed) return false;
    if (this.state === 'recording') return true;

    try {
      // 1. 请求权限
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('麦克风权限未授予');
      }

      // 2. 配置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1, // DO_NOT_MIX
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1, // DO_NOT_MIX
        playThroughEarpieceAndroid: false,
      });

      // 3. 开始循环录制
      await this.startRecordingCycle();
      return true;
    } catch (error) {
      this.state = 'error';
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 停止音频采集
   */
  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // 忽略停止时的错误
      }
      this.recording = null;
    }

    this.state = 'stopped';
  }

  /**
   * 释放所有资源
   */
  async release(): Promise<void> {
    this.isDestroyed = true;
    await this.stop();
  }

  /**
   * 开始一个录制周期：录制短片段 -> 读取 PCM 数据 -> 回调 -> 清理 -> 下一个周期
   */
  private async startRecordingCycle(): Promise<void> {
    const cycle = async () => {
      if (this.isDestroyed || this.state === 'stopped') return;

      try {
        await this.recordSegment();
      } catch (error) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // 立即执行第一次
    await cycle();

    // 定时循环
    this.intervalId = setInterval(cycle, this.config.segmentDurationMs);
  }

  /**
   * 录制一段音频并读取 PCM 数据
   */
  private async recordSegment(): Promise<void> {
    // 1. 准备并开始录制
    this.state = 'preparing';
    this.recording = new Audio.Recording();

    const recordingOptions = this.getRecordingOptions();

    try {
      await this.recording.prepareToRecordAsync(recordingOptions);
    } catch (error) {
      this.recording = null;
      throw error;
    }

    // 设置音量监测回调
    if (this.config.isMeteringEnabled && this.callbacks.onAudioLevel) {
      this.recording.setOnRecordingStatusUpdate((status: any) => {
        if (status.metering !== undefined) {
          this.callbacks.onAudioLevel?.(status.metering);
        }
      });
      // 设置较快的轮询间隔以获取音量
      this.recording.setProgressUpdateInterval(50);
    }

    // 2. 开始录制
    this.state = 'recording';
    await this.recording.startAsync();

    // 3. 等待录制完成
    await new Promise(resolve =>
      setTimeout(resolve, this.config.segmentDurationMs)
    );

    // 4. 停止录制
    const uri = this.recording.getURI();
    try {
      await this.recording.stopAndUnloadAsync();
    } catch {
      // 忽略
    }
    this.recording = null;

    // 5. 读取并解析 PCM 数据
    if (uri) {
      try {
        const pcmData = await this.readPCMDataFromFile(uri);
        if (pcmData.length > 0) {
          this.callbacks.onAudioData(pcmData);
        }
      } catch (error) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      }

      // 6. 清理临时文件
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // 忽略文件删除错误
      }
    }
  }

  /**
   * 获取录音配置（iOS 使用 LINEARPCM 以便直接解析）
   */
  private getRecordingOptions() {
    return {
      isMeteringEnabled: this.config.isMeteringEnabled,
      android: {
        extension: '.wav',
        sampleRate: this.config.sampleRate,
        numberOfChannels: this.config.numberOfChannels,
        bitRate: this.config.sampleRate * this.config.bitDepth * this.config.numberOfChannels,
        outputFormat: 0, // DEFAULT
        audioEncoder: 0, // DEFAULT
      },
      ios: {
        extension: '.wav',
        sampleRate: this.config.sampleRate,
        numberOfChannels: this.config.numberOfChannels,
        bitRate: this.config.sampleRate * this.config.bitDepth * this.config.numberOfChannels,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        linearPCMBitDepth: this.config.bitDepth,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/wav',
      },
    };
  }

  /**
   * 从 WAV 文件中读取 PCM 数据并转换为 Float32Array
   *
   * WAV 文件结构：
   * - Bytes 0-3:   "RIFF"
   * - Bytes 4-7:   文件大小
   * - Bytes 8-11:  "WAVE"
   * - Bytes 12-15: "fmt "
   * - Bytes 16-19: fmt chunk 大小
   * - Bytes 20-35: 音频格式参数（采样率、声道数、位深度等）
   * - Bytes 36-39: "data"
   * - Bytes 40-43: data chunk 大小
   * - Bytes 44+:   PCM 音频数据
   */
  private async readPCMDataFromFile(uri: string): Promise<Float32Array> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return new Float32Array(0);
    }

    // 读取整个文件为 base64
    const base64Content = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Base64 解码
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 解析 WAV 头部
    return this.parseWAVToFloat32(bytes, this.config.bitDepth);
  }

  /**
   * 解析 WAV 二进制数据为 Float32Array
   */
  private parseWAVToFloat32(bytes: Uint8Array, bitDepth: number): Float32Array {
    // 查找 "data" chunk
    let dataOffset = -1;
    let dataSize = 0;

    for (let i = 0; i < bytes.length - 8; i++) {
      const chunkId = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
      if (chunkId === 'data') {
        dataOffset = i + 8; // 跳过 "data" + 4 bytes size
        dataSize = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
        break;
      }
    }

    if (dataOffset === -1 || dataSize === 0) {
      return new Float32Array(0);
    }

    // 根据位深度解析
    const numSamples = dataSize / (bitDepth / 8);
    const float32Data = new Float32Array(numSamples);
    const maxAmplitude = Math.pow(2, bitDepth - 1);

    if (bitDepth === 16) {
      // 16-bit signed integer (little-endian)
      for (let i = 0; i < numSamples; i++) {
        const offset = dataOffset + i * 2;
        const sample = bytes[offset] | (bytes[offset + 1] << 8);
        // 转换有符号整数
        const signedSample = sample > 32767 ? sample - 65536 : sample;
        float32Data[i] = signedSample / maxAmplitude;
      }
    } else if (bitDepth === 32) {
      // 32-bit float
      const dataView = new DataView(bytes.buffer, bytes.byteOffset + dataOffset, dataSize);
      for (let i = 0; i < numSamples; i++) {
        float32Data[i] = dataView.getFloat32(i * 4, true); // little-endian
      }
    }

    return float32Data;
  }
}

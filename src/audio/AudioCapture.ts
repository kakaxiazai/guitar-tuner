import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base-64';
import { configureTunerAudioMode } from './AudioConfig';

/** AudioCapture 配置 */
export interface AudioCaptureConfig {
  sampleRate: number;
  numberOfChannels: number;
  bitDepth: number;
  segmentDurationMs: number;
  isMeteringEnabled: boolean;
}

/** AudioCapture 事件回调 */
export interface AudioCaptureCallbacks {
  onAudioData: (data: Float32Array) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
  onPermissionRequired?: () => void;
}

/** AudioCapture 状态 */
export type AudioCaptureState = 'idle' | 'requesting_permission' | 'preparing' | 'recording' | 'stopped' | 'error' | 'permission_denied';

export class AudioCapture {
  private recording: Audio.Recording | null = null;
  private config: AudioCaptureConfig;
  private callbacks: AudioCaptureCallbacks;
  private state: AudioCaptureState = 'idle';
  private recordingUri: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  // 缓存权限状态，避免重复请求
  private permissionCache: { granted: boolean; canAskAgain: boolean } | null = null;

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

  getState(): AudioCaptureState {
    return this.state;
  }

  setCallbacks(callbacks: AudioCaptureCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 请求麦克风权限 - 只请求一次，结果缓存
   */
  async requestPermission(): Promise<boolean> {
    // 如果已经缓存了权限结果，直接返回
    if (this.permissionCache !== null) {
      return this.permissionCache.granted;
    }

    // 如果正在请求中，等待
    if (this.state === 'requesting_permission') {
      // 等待最多 2 秒
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (this.permissionCache !== null) {
        return this.permissionCache.granted;
      }
      return false;
    }

    this.state = 'requesting_permission';
    try {
      const { granted, canAskAgain } = await Audio.requestPermissionsAsync();
      this.permissionCache = { granted, canAskAgain };

      if (granted) {
        this.state = 'idle';
        return true;
      } else {
        this.state = 'permission_denied';
        // 通知 UI 层显示权限说明
        this.callbacks.onPermissionRequired?.();
        return false;
      }
    } catch (error) {
      this.state = 'error';
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 清除权限缓存（当用户从设置中返回时调用）
   */
  clearPermissionCache(): void {
    this.permissionCache = null;
    if (this.state === 'permission_denied') {
      this.state = 'idle';
    }
  }

  /**
   * 开始音频采集
   */
  async start(): Promise<boolean> {
    if (this.isDestroyed) return false;
    if (this.state === 'recording') return true;
    // 如果权限被拒绝，不再尝试
    if (this.state === 'permission_denied') {
      return false;
    }

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        // 不在这里抛错，让 UI 层处理
        return false;
      }

      await configureTunerAudioMode();
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
        // 忽略
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
   * 开始录制循环
   */
  private async startRecordingCycle(): Promise<void> {
    const cycle = async () => {
      if (this.isDestroyed || this.state === 'stopped') return;

      try {
        await this.recordSegment();
      } catch (error) {
        // 录制错误只记录，不弹窗（避免循环弹窗）
        console.error('录制片段失败:', error);
      }
    };

    await cycle();
    this.intervalId = setInterval(cycle, this.config.segmentDurationMs);
  }

  /**
   * 录制一段音频
   */
  private async recordSegment(): Promise<void> {
    this.state = 'preparing';
    this.recording = new Audio.Recording();

    const recordingOptions = this.getRecordingOptions();

    try {
      await this.recording.prepareToRecordAsync(recordingOptions);
    } catch (error) {
      this.recording = null;
      // prepareToRecordAsync 失败时等待一会再重试
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    if (this.config.isMeteringEnabled && this.callbacks.onAudioLevel) {
      this.recording.setOnRecordingStatusUpdate((status: any) => {
        if (status.metering !== undefined) {
          this.callbacks.onAudioLevel?.(status.metering);
        }
      });
      this.recording.setProgressUpdateInterval(50);
    }

    this.state = 'recording';
    try {
      await this.recording.startAsync();
    } catch (error) {
      this.recording = null;
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    await new Promise(resolve =>
      setTimeout(resolve, this.config.segmentDurationMs)
    );

    const uri = this.recording.getURI();
    try {
      await this.recording.stopAndUnloadAsync();
    } catch {
      // 忽略
    }
    this.recording = null;

    if (uri) {
      try {
        const pcmData = await this.readPCMDataFromFile(uri);
        if (pcmData.length > 0) {
          this.callbacks.onAudioData(pcmData);
        }
      } catch (error) {
        console.error('读取PCM数据失败:', error);
      }

      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // 忽略
      }
    }
  }

  private getRecordingOptions() {
    return {
      isMeteringEnabled: this.config.isMeteringEnabled,
      android: {
        extension: '.wav',
        sampleRate: this.config.sampleRate,
        numberOfChannels: this.config.numberOfChannels,
        bitRate: this.config.sampleRate * this.config.bitDepth * this.config.numberOfChannels,
        outputFormat: 0,
        audioEncoder: 0,
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

  private async readPCMDataFromFile(uri: string): Promise<Float32Array> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return new Float32Array(0);
      }

      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const binaryString = base64Decode(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return this.parseWAVToFloat32(bytes, this.config.bitDepth);
    } catch (error) {
      console.error('读取音频文件失败:', error);
      return new Float32Array(0);
    }
  }

  private parseWAVToFloat32(bytes: Uint8Array, bitDepth: number): Float32Array {
    let dataOffset = -1;
    let dataSize = 0;

    for (let i = 0; i < bytes.length - 8; i++) {
      const chunkId = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
      if (chunkId === 'data') {
        dataOffset = i + 8;
        dataSize = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
        break;
      }
    }

    if (dataOffset === -1 || dataSize === 0) {
      return new Float32Array(0);
    }

    const numSamples = dataSize / (bitDepth / 8);
    const float32Data = new Float32Array(numSamples);
    const maxAmplitude = Math.pow(2, bitDepth - 1);

    if (bitDepth === 16) {
      for (let i = 0; i < numSamples; i++) {
        const offset = dataOffset + i * 2;
        const sample = bytes[offset] | (bytes[offset + 1] << 8);
        const signedSample = sample > 32767 ? sample - 65536 : sample;
        float32Data[i] = signedSample / maxAmplitude;
      }
    } else if (bitDepth === 32) {
      const dataView = new DataView(bytes.buffer, bytes.byteOffset + dataOffset, dataSize);
      for (let i = 0; i < numSamples; i++) {
        float32Data[i] = dataView.getFloat32(i * 4, true);
      }
    }

    return float32Data;
  }
}

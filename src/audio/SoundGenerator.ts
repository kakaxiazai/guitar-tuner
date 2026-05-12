import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * 音频生成器类 - 用于播放参考音和节拍器声音
 */
export class SoundGenerator {
  private sound: Audio.Sound | null = null;
  private volume: number = 0.5;

  /**
   * 播放正弦波音调
   * @param frequency 频率
   * @param duration 持续时间（秒）
   */
  async playTone(frequency: number, duration: number = 0.1): Promise<void> {
    try {
      // 如果已经有声音在播放，先停止
      await this.stop();

      // 生成WAV的base64数据
      const wavBase64 = await this.generateWAVBase64(frequency, duration);

      // 播放生成的WAV数据
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${wavBase64}` },
        { shouldPlay: true, volume: this.volume }
      );

      this.sound = sound;

      // 监听播放完成，自动清理
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.cleanup();
        }
      });
    } catch (error) {
      console.error('播放音调失败:', error);
      throw error;
    }
  }

  /**
   * 生成WAV文件的base64数据
   * @param frequency 频率
   * @param duration 持续时间（秒）
   * @returns base64字符串
   */
  private async generateWAVBase64(
    frequency: number,
    duration: number
  ): Promise<string> {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bitsPerSample = 16;

    // 生成音频数据
    const samples = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t);
      // 应用简单的包络（避免爆音）
      const envelope = Math.min(1, Math.min(i / 100, (numSamples - i) / 100));
      samples[i] = Math.floor(sample * envelope * 32767);
    }

    // 创建WAV缓冲区
    const wavBuffer = this.createWAVBuffer(samples, sampleRate, numChannels, bitsPerSample);

    // 转换为base64
    return this.arrayBufferToBase64(wavBuffer);
  }

  /**
   * 创建WAV文件缓冲区
   */
  private createWAVBuffer(
    samples: Int16Array,
    sampleRate: number,
    numChannels: number,
    bitsPerSample: number
  ): ArrayBuffer {
    const dataSize = samples.length * (bitsPerSample / 8);
    const bufferSize = 44 + dataSize; // 44字节头部 + 数据
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // WAV头部
    // RIFF chunk
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM格式
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // 写入音频数据
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(44 + i * 2, samples[i], true);
    }

    return buffer;
  }

  /**
   * 将字符串写入DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 播放吉他参考音
   * @param stringNumber 琴弦编号（6-1）
   */
  async playGuitarString(stringNumber: number): Promise<void> {
    const frequencies: Record<number, number> = {
      6: 82.41,  // E2
      5: 110.00, // A2
      4: 146.83, // D3
      3: 196.00, // G3
      2: 246.94, // B3
      1: 329.63, // E4
    };

    const target = frequencies[stringNumber];

    if (!target) {
      throw new Error(`无效的琴弦编号: ${stringNumber}`);
    }

    await this.playTone(target, 3);
  }

  /**
   * 播放音阶音符
   * @param note 音符名称
   */
  async playNote(note: string): Promise<void> {
    const frequencies: Record<string, number> = {
      'E2': 82.41,
      'A2': 110.00,
      'D3': 146.83,
      'G3': 196.00,
      'B3': 246.94,
      'E4': 329.63,
      'C4': 261.63,
      'D4': 293.66,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00,
      'B4': 493.88,
      'C5': 523.25,
      'D5': 587.33,
    };

    const frequency = frequencies[note];
    if (!frequency) {
      throw new Error(`无效的音符: ${note}`);
    }

    await this.playTone(frequency, 2);
  }

  /**
   * 停止播放
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('停止播放失败:', error);
      }
      this.sound = null;
    }
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('清理资源失败:', error);
      }
      this.sound = null;
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取播放状态
   */
  isCurrentlyPlaying(): boolean {
    return this.sound !== null;
  }

  /**
   * 释放资源
   */
  async release(): Promise<void> {
    await this.stop();
  }
}

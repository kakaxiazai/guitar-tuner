/**
 * 音高检测类 - 使用自相关算法
 * 支持吉他频率范围：80Hz - 400Hz
 */
export class PitchDetector {
  private sampleRate = 44100;
  private minFreq = 80;  // 最低频率 (吉他低音弦)
  private maxFreq = 400; // 最高频率 (吉他高音弦)
  private minPeriod: number;
  private maxPeriod: number;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
    this.minPeriod = Math.round(this.sampleRate / this.maxFreq);
    this.maxPeriod = Math.round(this.sampleRate / this.minFreq);
  }

  /**
   * 处理音频数据并检测音高
   * @param samples 音频采样数据 (Float32Array)
   * @returns 检测到的频率，如果无法检测返回 null
   */
  processAudioData(samples: Float32Array): number | null {
    if (samples.length < this.minPeriod * 2) {
      return null;
    }

    // 1. 预处理：加窗（Hann window）
    const windowedSamples = this.applyHannWindow(samples);

    // 2. 计算自相关函数
    const autocorr = this.computeAutocorrelation(windowedSamples);

    // 3. 寻找第一个峰值
    const lag = this.findFirstPeak(autocorr);

    if (lag === null || lag < this.minPeriod || lag > this.maxPeriod) {
      return null;
    }

    // 4. 抛物线插值提高精度
    const betterLag = this.parabolicInterpolation(autocorr, lag);

    // 5. 转换为频率
    const frequency = this.sampleRate / betterLag;

    return frequency;
  }

  /**
   * 加窗处理
   */
  private applyHannWindow(samples: Float32Array): Float32Array {
    const windowed = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (samples.length - 1)));
      windowed[i] = samples[i] * window;
    }
    return windowed;
  }

  /**
   * 计算自相关函数
   */
  private computeAutocorrelation(signal: Float32Array): Float32Array {
    const n = signal.length;
    const autocorr = new Float32Array(n);

    for (let lag = 0; lag < n; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += signal[i] * signal[i + lag];
      }
      autocorr[lag] = sum;
    }

    return autocorr;
  }

  /**
   * 寻找第一个显著峰值
   */
  private findFirstPeak(autocorr: Float32Array): number | null {
    // 预处理：去除第一个延迟（通常为零延迟，自相关值最大）
    const startIndex = Math.floor(this.minPeriod * 0.9);

    let firstPeak = -1;
    for (let i = startIndex; i < autocorr.length; i++) {
      if (autocorr[i] > autocorr[i - 1] && autocorr[i] >= autocorr[i + 1]) {
        firstPeak = i;
        break;
      }
    }

    return firstPeak >= 0 ? firstPeak : null;
  }

  /**
   * 抛物线插值提高精度
   */
  private parabolicInterpolation(autocorr: Float32Array, peakIndex: number): number {
    const prev = autocorr[peakIndex - 1];
    const curr = autocorr[peakIndex];
    const next = autocorr[peakIndex + 1];

    if (prev === curr || next === curr) {
      return peakIndex;
    }

    // 抛物线插值公式
    const offset = (prev - next) / (2 * (2 * curr - prev - next));
    return peakIndex + offset;
  }

  /**
   * 将频率转换为音符名称
   */
  getNoteFromFrequency(frequency: number): { note: string; octave: number; midiNote: number } {
    const A4 = 440;
    const A4Index = 57; // MIDI note number for A4

    const midiNote = Math.round(12 * Math.log2(frequency / A4) + A4Index);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteNames[midiNote % 12];
    const octave = Math.floor(midiNote / 12) - 1;

    return { note, octave, midiNote };
  }

  /**
   * 计算音分偏差
   */
  getCentsDeviation(frequency: number, targetFrequency: number): number {
    return 1200 * Math.log2(frequency / targetFrequency);
  }

  /**
   * 获取吉他标准调弦频率表
   */
  static getGuitarStrings(): { string: number; note: string; frequency: number }[] {
    return [
      { string: 6, note: 'E2', frequency: 82.41 },
      { string: 5, note: 'A2', frequency: 110.00 },
      { string: 4, note: 'D3', frequency: 146.83 },
      { string: 3, note: 'G3', frequency: 196.00 },
      { string: 2, note: 'B3', frequency: 246.94 },
      { string: 1, note: 'E4', frequency: 329.63 },
    ];
  }

  /**
   * 根据音符名称获取频率
   */
  static getFrequencyFromNote(note: string): number {
    const noteFrequencies: Record<string, number> = {
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
    return noteFrequencies[note] || 440;
  }
}

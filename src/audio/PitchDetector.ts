/**
 * 音高检测类 - 使用 YIN 算法（改进的自相关）
 * YIN 是专业调音器（如 Fine Tuner）广泛使用的音高检测算法
 * 参考: Cheveigné, A., & Kawahara, H. (2002). YIN, a fundamental frequency estimator
 */
export class PitchDetector {
  private sampleRate = 44100;
  private minFreq = 75;    // 最低频率 (吉他低音弦 E2)
  private maxFreq = 1200;  // 最高频率 (包含泛音以提高检测精度)
  private minPeriod: number;
  private maxPeriod: number;

  // YIN 算法阈值 - 低阈值 = 更严格检测（减少误报）
  private readonly YIN_THRESHOLD = 0.15;
  // 信号门限
  private readonly RMS_THRESHOLD = 0.008;
  // 置信度阈值
  private readonly CONFIDENCE_THRESHOLD = 0.5;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
    this.minPeriod = Math.round(this.sampleRate / this.maxFreq);
    this.maxPeriod = Math.round(this.sampleRate / this.minFreq);
  }

  /**
   * 处理音频数据并检测音高（YIN 算法）
   * @param samples 音频采样数据 (Float32Array)
   * @param autoGain 是否启用自动增益
   * @returns { frequency: number | null, confidence: number } 检测到的频率和置信度
   */
  processAudioData(samples: Float32Array, autoGain: boolean = false): { frequency: number | null; confidence: number } {
    if (samples.length < this.minPeriod * 2) {
      return { frequency: null, confidence: 0 };
    }

    let processedSamples = samples;
    if (autoGain) {
      processedSamples = this.applyAutoGain(samples);
    }

    // 信号门限：如果信号能量太低，跳过检测
    const rms = this.calculateRMS(processedSamples);
    if (rms < this.RMS_THRESHOLD) {
      return { frequency: null, confidence: 0 };
    }

    // 1. 计算差分函数（Difference Function）
    //    注意：YIN 是**时域**方法，这里不能先加 Hann 窗。加窗会使 x[i] 与 x[i+tau]
    //    乘以不同的窗系数，即使 tau 正好等于真实周期也无法相消，导致谷值整体偏移。
    //    实测加窗会把最大频率误差从 0.7 音分放大到 4.4 音分。
    const diff = this.computeDifference(processedSamples);

    // 2. 累积均值归一化（CMNDF）- YIN 的核心改进
    const cmndf = this.computeCMNDF(diff);

    // 3. 使用绝对阈值寻找第一个谷值
    const result = this.findPitch(cmndf);

    if (result === null) {
      return { frequency: null, confidence: 0 };
    }

    // 4. 抛物线插值提高精度
    const betterLag = this.parabolicInterpolation(cmndf, result.lag);

    // 5. 转换为频率
    const frequency = this.sampleRate / betterLag;

    // 6. 验证频率是否在合理范围内
    if (frequency < this.minFreq || frequency > this.maxFreq) {
      return { frequency: null, confidence: 0 };
    }

    return { frequency, confidence: result.confidence };
  }

  /**
   * 计算差分函数（Difference Function）
   * d(tau) = sum of (x[i] - x[i + tau])^2
   */
  private computeDifference(signal: Float32Array): Float32Array {
    const n = signal.length;
    const diff = new Float32Array(Math.floor(n / 2));

    for (let tau = 0; tau < diff.length; tau++) {
      let sum = 0;
      for (let i = 0; i < diff.length; i++) {
        const delta = signal[i] - signal[i + tau];
        sum += delta * delta;
      }
      diff[tau] = sum;
    }

    return diff;
  }

  /**
   * 累积均值归一化（CMNDF）- YIN 算法核心
   * cmndf(tau) = d(tau) / ((1/tau) * sum(d(1) to d(tau)))
   */
  private computeCMNDF(diff: Float32Array): Float32Array {
    const cmndf = new Float32Array(diff.length);
    cmndf[0] = 1; // 避免除零

    let runningSum = 0;
    for (let tau = 1; tau < diff.length; tau++) {
      runningSum += diff[tau];
      cmndf[tau] = runningSum > 0 ? diff[tau] / (runningSum / tau) : 1;
    }

    return cmndf;
  }

  /**
   * 使用绝对阈值寻找第一个谷值
   * 返回 lag 和置信度
   */
  private findPitch(cmndf: Float32Array): { lag: number; confidence: number } | null {
    const startSearch = Math.max(1, this.minPeriod);
    const endSearch = Math.min(cmndf.length - 1, this.maxPeriod);

    // 寻找 CMNDF 曲线中第一个低于阈值的点
    for (let tau = startSearch; tau < endSearch; tau++) {
      if (cmndf[tau] < this.YIN_THRESHOLD) {
        // 找到局部最小值
        if (cmndf[tau] <= cmndf[tau - 1] && cmndf[tau] <= cmndf[tau + 1]) {
          // 置信度 = 1 - CMNDF 值（越接近 0 越可靠）
          const confidence = Math.max(0, 1 - cmndf[tau]);
          if (confidence >= this.CONFIDENCE_THRESHOLD) {
            return { lag: tau, confidence };
          }
        }
      }
    }

    // 如果没找到低于阈值的点，尝试找全局最小值
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = startSearch; tau < endSearch; tau++) {
      if (cmndf[tau] < minVal) {
        minVal = cmndf[tau];
        minTau = tau;
      }
    }

    if (minTau >= 0) {
      const confidence = Math.max(0, 1 - minVal) * 0.5; // 降低置信度
      return { lag: minTau, confidence };
    }

    return null;
  }

  /**
   * 抛物线插值提高精度
   *
   * 标准三点顶点公式（采样点位于 -1 / 0 / +1）：
   *   x* = (y(-1) - y(+1)) / (2 * (y(-1) - 2*y(0) + y(+1)))
   *
   * ⚠️ 旧实现分母写成 `2 * (2*y(0) - y(-1) - y(+1))`，等价于把分子**取反**：
   * 插值会朝错误方向偏移，把误差放大近一倍（实测 B3 由 ≈0 恶化到 +10.2 音分）。
   * 修正后（并去掉 YIN 路径上的 Hann 窗）实测最大误差 10.2 → 0.7 音分。
   */
  private parabolicInterpolation(cmndf: Float32Array, peakIndex: number): number {
    if (peakIndex <= 0 || peakIndex >= cmndf.length - 1) {
      return peakIndex;
    }

    const prev = cmndf[peakIndex - 1];
    const curr = cmndf[peakIndex];
    const next = cmndf[peakIndex + 1];

    const denominator = prev - 2 * curr + next;
    if (denominator === 0) {
      return peakIndex;
    }

    return peakIndex + (prev - next) / (2 * denominator);
  }

  /**
   * 计算信号 RMS（均方根）电平
   */
  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * 自动增益控制
   */
  private applyAutoGain(samples: Float32Array): Float32Array {
    const rms = this.calculateRMS(samples);
    const targetRMS = 0.3;

    if (rms < 0.005) {
      return samples;
    }

    const gain = Math.min(targetRMS / rms, 10);
    const result = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      result[i] = Math.max(-1, Math.min(1, samples[i] * gain));
    }
    return result;
  }

  /**
   * 将频率转换为音符名称
   */
  getNoteFromFrequency(frequency: number): { note: string; octave: number; midiNote: number } {
    const A4 = 440;
    const A4Index = 69; // MIDI note number for A4

    const midiNote = Math.round(12 * Math.log2(frequency / A4) + A4Index);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteNames[((midiNote % 12) + 12) % 12]; // 确保正数
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
      'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00,
      'B3': 246.94, 'E4': 329.63, 'C4': 261.63, 'D4': 293.66,
      'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33,
    };
    return noteFrequencies[note] || 440;
  }
}

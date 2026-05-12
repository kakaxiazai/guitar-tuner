import { TUNER_CONFIG } from '../constants/Settings';

/**
 * 频率工具类
 */

/**
 * 音分偏差对应的百分比
 */
export const CENTS_PERCENTAGES = {
  perfect: '< 2%',
  good: '< 5%',
  warning: '< 10%',
  error: '> 10%',
};

/**
 * 音分偏差颜色
 */
export const CENTS_COLORS = {
  perfect: '#27ae60',  // 绿色
  good: '#f39c12',     // 黄色
  warning: '#e67e22',  // 橙色
  error: '#e74c3c',    // 红色
};

/**
 * 频率平滑函数 - 使用移动平均减少抖动
 * @param frequency 当前频率
 * @param previousFrequencies 历史频率数组
 * @param windowSize 窗口大小
 * @returns 平滑后的频率
 */
export function smoothFrequency(
  frequency: number,
  previousFrequencies: number[],
  windowSize: number = 5
): number {
  if (previousFrequencies.length < windowSize) {
    return frequency;
  }

  // 计算平均值
  const sum = previousFrequencies.slice(-windowSize).reduce((a, b) => a + b, 0);
  return sum / windowSize;
}

/**
 * 检测频率是否稳定
 * @param frequencies 历史频率数组
 * @param stabilityThreshold 稳定性阈值（音分）
 * @returns 是否稳定
 */
export function isFrequencyStable(
  frequencies: number[],
  stabilityThreshold: number = 10
): boolean {
  if (frequencies.length < 5) {
    return false;
  }

  const recent = frequencies.slice(-10);
  const min = Math.min(...recent);
  const max = Math.max(...recent);

  return (max - min) < stabilityThreshold;
}

/**
 * 判断两个频率是否接近
 * @param freq1 频率1
 * @param freq2 频率2
 * @param threshold 音分阈值
 * @returns 是否接近
 */
export function areFrequenciesClose(freq1: number, freq2: number, threshold: number = 25): boolean {
  const deviation = Math.abs(calculateCentsDeviation(freq1, freq2));
  return deviation < threshold;
}

/**
 * 获取频率显示文本
 * @param frequency 频率
 * @param precision 精度（小数位数）
 * @returns 格式化后的频率字符串
 */
export function formatFrequency(frequency: number, precision: number = 1): string {
  return frequency.toFixed(precision) + ' Hz';
}

/**
 * 获取音分显示文本
 * @param cents 音分偏差
 * @returns 格式化后的音分字符串
 */
export function formatCents(cents: number): string {
  const sign = cents > 0 ? '+' : '';
  return `${sign}${cents}音分`;
}

/**
 * 计算音分偏差（频率差异）
 * @param freq1 频率1
 * @param freq2 频率2
 * @returns 音分偏差
 */
export function calculateCentsDeviation(freq1: number, freq2: number): number {
  return 1200 * Math.log2(freq1 / freq2);
}

/**
 * 计算音分偏差对应的百分比
 * @param cents 音分偏差
 * @returns 百分比
 */
export function getCentsPercentage(cents: number): number {
  return Math.abs(cents / 100);
}

/**
 * 将频率转换为虚拟波形显示（用于UI可视化）
 * @param frequency 频率
 * @param amplitude 振幅
 * @param samples 样本数
 * @returns 波形数据数组
 */
export function generateWaveform(frequency: number, amplitude: number, samples: number = 100): number[] {
  return Array.from({ length: samples }, (_, i) => {
    const phase = (i / samples) * 2 * Math.PI;
    return Math.sin(phase * frequency / 10) * amplitude;
  });
}

/**
 * 检查频率是否在有效范围内
 * @param frequency 频率
 * @param minFreq 最低频率
 * @param maxFreq 最高频率
 * @returns 是否有效
 */
export function isValidFrequency(
  frequency: number,
  minFreq: number = 80,
  maxFreq: number = 400
): boolean {
  return frequency >= minFreq && frequency <= maxFreq;
}

/**
 * 归一化频率到0-1范围（用于仪表盘）
 * @param frequency 频率
 * @param minFreq 最低频率
 * @param maxFreq 最高频率
 * @returns 归一化值
 */
export function normalizeFrequency(
  frequency: number,
  minFreq: number = 80,
  maxFreq: number = 400
): number {
  return Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
}

/**
 * 将音分偏差映射到角度（用于针式仪表盘）
 * @param cents 音分偏差
 * @param range 音分范围
 * @returns 角度
 */
export function centsToAngle(cents: number, range: number = 50): number {
  return (cents / range) * 45; // +/- 45度
}

/**
 * 频率稳定性计算
 */
export interface FrequencyStability {
  isStable: boolean;
  lastDeviation: number;
  averageDeviation: number;
}

/**
 * 计算频率稳定性
 * @param frequencies 频率数组
 * @returns 稳定性信息
 */
export function calculateFrequencyStability(frequencies: number[]): FrequencyStability {
  if (frequencies.length < 5) {
    return {
      isStable: false,
      lastDeviation: 0,
      averageDeviation: 0,
    };
  }

  const avg = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
  const deviations = frequencies.map(f => Math.abs(f - avg));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

  const lastDeviation = deviations[deviations.length - 1];

  return {
    isStable: avgDeviation < 5, // 5音分以内视为稳定
    lastDeviation,
    averageDeviation: avgDeviation,
  };
}

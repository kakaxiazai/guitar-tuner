/**
 * 音符工具类
 */

/**
 * 音符频率对照表（吉他标准调弦）
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  'E2': 82.41,  // 低音E
  'A2': 110.00, // A
  'D3': 146.83, // D
  'G3': 196.00, // G
  'B3': 246.94, // B
  'E4': 329.63, // 高音E
  'C4': 261.63, // 中央C
  'D4': 293.66,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00, // 参考音
  'B4': 493.88,
  'C5': 523.25,
  'D5': 587.33,
};

/**
 * 音符名称数组
 */
export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * 将频率转换为音符名称
 * @param frequency 频率
 * @returns 音符对象 { note: string, octave: number, midiNote: number }
 */
export function getNoteFromFrequency(frequency: number): { note: string; octave: number; midiNote: number } {
  const A4 = 440;
  const A4Index = 57; // MIDI note number for A4

  const midiNote = Math.round(12 * Math.log2(frequency / A4) + A4Index);

  const noteIndex = midiNote % 12;
  const note = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midiNote / 12) - 1;

  return { note, octave, midiNote };
}

/**
 * 计算音分偏差
 * @param frequency 实际频率
 * @param targetFrequency 目标频率
 * @returns 音分偏差（正数表示偏高，负数表示偏低）
 */
export function getCentsDeviation(frequency: number, targetFrequency: number): number {
  return 1200 * Math.log2(frequency / targetFrequency);
}

/**
 * 将音分偏差转换为百分比
 * @param cents 音分偏差
 * @returns 百分比偏差
 */
export function centsToPercentage(cents: number): number {
  return Math.abs(cents / 100);
}

/**
 * 根据音分偏差判断调音状态
 * @param cents 音分偏差
 * @returns 状态字符串：'perfect' | 'good' | 'warning' | 'error'
 */
export function getTuningStatus(cents: number): 'perfect' | 'good' | 'warning' | 'error' {
  const absCents = Math.abs(cents);

  if (absCents < 2) return 'perfect';
  if (absCents < 10) return 'good';
  if (absCents < 25) return 'warning';
  return 'error';
}

/**
 * 获取吉他标准调弦
 */
export function getGuitarStrings(): { string: number; note: string; frequency: number }[] {
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
export function getFrequencyFromNote(note: string): number {
  return NOTE_FREQUENCIES[note] || 440;
}

/**
 * 计算两个频率之间的八度数
 */
export function calculateOctaveDistance(freq1: number, freq2: number): number {
  return Math.floor(Math.log2(freq2 / freq1));
}

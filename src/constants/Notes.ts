/**
 * 音符常量
 */

// 吉他标准调弦频率
export const GUITAR_STRING_FREQUENCIES: Record<number, number> = {
  6: 82.41,  // E2
  5: 110.00, // A2
  4: 146.83, // D3
  3: 196.00, // G3
  2: 246.94, // B3
  1: 329.63, // E4
};

// 琴弦信息
export const GUITAR_STRINGS = [
  { number: 6, note: 'E2', frequency: 82.41 },
  { number: 5, note: 'A2', frequency: 110.00 },
  { number: 4, note: 'D3', frequency: 146.83 },
  { number: 3, note: 'G3', frequency: 196.00 },
  { number: 2, note: 'B3', frequency: 246.94 },
  { number: 1, note: 'E4', frequency: 329.63 },
];

// 音符频率对照表
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25,
  'C#5': 554.37,
  'D5': 587.33,
  'D#5': 622.25,
  'E5': 659.25,
};

// 音符名称
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 音符数组（用于音符选择器）
export const NOTES_LIST = [
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
];

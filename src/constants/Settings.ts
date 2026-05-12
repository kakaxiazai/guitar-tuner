/**
 * 设置常量
 */

// 节拍器配置
export const METRONOME_CONFIG = {
  MIN_BPM: 20,
  MAX_BPM: 280,
  DEFAULT_BPM: 120,
  TAP_TEMO_DEBOUNCE_MS: 1500, // Tap Tempo 去抖动时间
  BEAT_INDICATOR_UPDATE_MS: 50, // 节拍指示器更新间隔
};

// 调音器配置
export const TUNER_CONFIG = {
  SAMPLE_RATE: 44100,
  MIN_FREQ: 80,  // 吉他最低频率
  MAX_FREQ: 400, // 吉他最高频率
  REFERENCE_PITCH: 440, // A4 参考音
  SMOOTHING_WINDOW: 5,  // 频率平滑窗口大小
  STABILITY_THRESHOLD: 10, // 频率稳定性阈值（音分）
  PERFECT_THRESHOLD: 2, // 完美音准阈值（音分）
  GOOD_THRESHOLD: 10, // 良好音准阈值（音分）
  WARNING_THRESHOLD: 25, // 警告阈值（音分）
};

// 调音状态
export const TUNER_STATUS = {
  PERFECT: 'perfect',
  GOOD: 'good',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// 调音状态颜色
export const TUNER_STATUS_COLORS: Record<string, string> = {
  [TUNER_STATUS.PERFECT]: '#27ae60',
  [TUNER_STATUS.GOOD]: '#f39c12',
  [TUNER_STATUS.WARNING]: '#e67e22',
  [TUNER_STATUS.ERROR]: '#e74c3c',
};

// 节拍类型
export const TIME_SIGNATURES = [
  { numerator: 2, denominator: 4, label: '2/4' },
  { numerator: 3, denominator: 4, label: '3/4' },
  { numerator: 4, denominator: 4, label: '4/4' },
  { numerator: 5, denominator: 4, label: '5/4' },
  { numerator: 6, denominator: 8, label: '6/8' },
  { numerator: 7, denominator: 8, label: '7/8' },
  { numerator: 9, denominator: 8, label: '9/8' },
];

// 细分节拍
export const SUBDIVISIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
];

// 节拍器声音类型
export const SOUND_TYPES = [
  { value: 'woodblock', label: '木鱼', icon: 'triangle' },
  { value: 'click', label: '点击', icon: 'hand-left' },
  { value: 'bell', label: '铃', icon: 'musical-notes' },
  { value: 'metronome', label: '节拍器', icon: 'time' },
];

// 视觉节拍颜色
export const BEAT_INDICATOR_COLORS = {
  INACTIVE: '#e0e0e0',
  ACCENT: '#3498db',
  CURRENT: '#27ae60',
};

// 音符间距
export const NOTE_SPACING = 20;

// 仪表盘配置
export const GAUGE_CONFIG = {
  NEEDLE_RANGE: 50, // 音分范围
  NEEDLE_MAX_ANGLE: 45, // 最大角度
  NEEDLE_COLOR: '#e74c3c',
};

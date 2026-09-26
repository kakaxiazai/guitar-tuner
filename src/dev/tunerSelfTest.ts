/**
 * 调音器自检（纯 TypeScript，**不含任何 React / React Native 依赖**）
 *
 * 目的：让「一段已知音高的 PCM → 音名 + 音分」这条核心链路，能在**没有麦克风**的
 * 环境里被自动断言 —— 本地 Node、云端模拟器、真实设备都能跑同一套用例。
 *
 * 为什么需要它：麦克风是纯硬件，CI 云端没有吉他可弹，所以「拨弦→音名」永远无法
 * 在云端自动判定。把输入换成**合成信号**后，链路里除了麦克风本身，其余环节
 * （缓冲 → YIN → 频率→音名 → 音分 → React 状态）全都能被验证。
 *
 * 三种跑法：
 * 1. 本地 Node：`node scripts/dev/run-selftest-node.mjs`（最快，验证算法与阈值）
 * 2. 设备端（云端模拟器 / 真机）：
 *    `adb shell am start -a android.intent.action.VIEW -d "guitartuner://selftest"`
 *    由 TunerSelfTestRunner 用**真实 hook** 逐条喂入，结果打到 logcat
 * 3. CI：`scripts/ci/tuner-selftest.sh` 解析 logcat 中的 `TUNER_SELFTEST_RESULT`
 *
 * ⚠️ `detectLikeHook()` 是 `usePitchDetection` 门限逻辑（置信度 0.4、频率范围）的**镜像**。
 *    若 hook 的阈值调整了，这里需要同步；设备端跑的是真实 hook，一旦两者分歧会被设备端自检暴露。
 */
import { PitchDetector } from '../audio/PitchDetector';
import { getNoteFromFrequency, getCentsDeviation, getTuningStatus } from '../utils/NoteUtils';
import { TUNER_CONFIG } from '../constants/Settings';

/** 自检使用的采样率（与 App 一致） */
export const SELFTEST_SAMPLE_RATE = TUNER_CONFIG.SAMPLE_RATE;
/** 自检分析窗长（采样点）。约 93ms @44.1kHz，与设备端单帧量级一致。 */
export const SELFTEST_WINDOW = 4096;

/** logcat 中用于 CI 解析的标记 */
export const SELFTEST_LOG_TAG = 'TUNER_SELFTEST';
export const SELFTEST_RESULT_PREFIX = 'TUNER_SELFTEST_RESULT ';

/**
 * 判定阈值。
 * - `maxCentsError`：频率准确度容差（音分）。修正 `PitchDetector` 的抛物线插值符号
 *   并去掉 YIN 路径上的 Hann 窗后，实测最大误差 ≤0.7 音分；这里取 ±5（专业调音器
 *   量级）仍留出约 7 倍余量，既是有意义的门槛，又不会因设备差异误报。
 * - `minConfidence`：YIN 置信度下限，防止「碰巧对了」的假阳性（实测 ≥0.9）。
 */
export const SELFTEST_LIMITS = {
  maxCentsError: 5,
  minConfidence: 0.6,
} as const;

export interface SelfTestCaseSpec {
  /** 用例标签，用于日志定位 */
  label: string;
  /** 目标弦频率（用于计算「音分读数」），静音用例为 0 */
  targetHz: number;
  /** 相对目标弦的失谐（音分），正为偏高 */
  detuneCents: number;
  /** 期望识别出的音名，静音为 null */
  expectedNote: string | null;
  /** 静音用例：不喂任何有效信号 */
  silence?: boolean;
}

/** 六个标准调弦音 + 一个失谐 + 一个静音（静音用于验证「不会凭空报音」） */
export const SELF_TEST_CASES: SelfTestCaseSpec[] = [
  { label: 'E2(6弦)', targetHz: 82.41, detuneCents: 0, expectedNote: 'E2' },
  { label: 'A2(5弦)', targetHz: 110.0, detuneCents: 0, expectedNote: 'A2' },
  { label: 'D3(4弦)', targetHz: 146.83, detuneCents: 0, expectedNote: 'D3' },
  { label: 'G3(3弦)', targetHz: 196.0, detuneCents: 0, expectedNote: 'G3' },
  { label: 'B3(2弦)', targetHz: 246.94, detuneCents: 0, expectedNote: 'B3' },
  { label: 'E4(1弦)', targetHz: 329.63, detuneCents: 0, expectedNote: 'E4' },
  { label: 'A2+25c(失谐)', targetHz: 110.0, detuneCents: 25, expectedNote: 'A2' },
  { label: '静音(不应报音)', targetHz: 0, detuneCents: 0, expectedNote: null, silence: true },
];

export interface DetectionOutcome {
  frequency: number | null;
  note: string | null;
  cents: number | null;
  status: string;
  confidence: number;
}

export interface SelfTestResult {
  label: string;
  expectedNote: string | null;
  detectedNote: string | null;
  /** 实际生成的频率（真值） */
  expectedHz: number;
  targetHz: number;
  detectedHz: number | null;
  /** 相对真值的频率误差（音分），衡量检测准确度 */
  freqErrorCents: number | null;
  /** 相对目标弦的音分读数（App 界面上显示的那个值） */
  cents: number | null;
  expectedCents: number;
  status: string;
  confidence: number;
  pass: boolean;
  reasons: string[];
}

export interface SelfTestReport {
  pass: boolean;
  passed: number;
  total: number;
  sampleRate: number;
  windowSize: number;
  limits: { maxCentsError: number; minConfidence: number };
  cases: SelfTestResult[];
  generatedAt: string;
}

/** 音分 → 频率倍率 */
export function ratioFromCents(cents: number): number {
  return Math.pow(2, cents / 1200);
}

/** 可复现的伪随机数（保证 CI 每次结果一致） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 合成一段「拨弦」信号：基频 + 多个泛音，各泛音指数衰减（高次衰减更快），
 * 叠加极轻的琴体非谐性与本底噪声，最后归一化到固定峰值。
 *
 * 比纯正弦更接近真实琴弦，能顺带验证 YIN 不会把 2 次/3 次泛音误判成基频
 * —— 这正是调音器最容易出错的场景。
 */
export function generatePluck(
  freq: number,
  sampleRate: number = SELFTEST_SAMPLE_RATE,
  length: number = SELFTEST_WINDOW,
  seed: number = 20260927
): Float32Array {
  const harmonics = [1, 2, 3, 4, 5, 6];
  const amps = [1, 0.55, 0.35, 0.22, 0.14, 0.09];
  const decays = [0.6, 1.4, 2.2, 3.0, 3.8, 4.6];

  const rand = mulberry32(seed);
  const raw = new Float32Array(length);
  let peak = 0;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      // 轻微非谐性：真实琴弦的高次泛音略高于整数倍
      const n = harmonics[h];
      const f = freq * n * (1 + 0.00004 * n * n);
      v += amps[h] * Math.exp(-decays[h] * t) * Math.sin(2 * Math.PI * f * t);
    }
    raw[i] = v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
  }

  const gain = peak > 0 ? 0.4 / peak : 0;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = raw[i] * gain + (rand() * 2 - 1) * 0.002; // 本底噪声
  }
  return out;
}

/** 合成接近无声的信号（仅极低本底），用于验证信号门限不会凭空报音 */
export function generateSilence(
  sampleRate: number = SELFTEST_SAMPLE_RATE,
  length: number = SELFTEST_WINDOW,
  seed: number = 20260927
): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = (rand() * 2 - 1) * 1e-5; // RMS ≈ 5.8e-6，远低于 0.008 门限
  }
  return out;
}

/** 计算 RMS */
export function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * 按 `usePitchDetection` 的门限逻辑做一次检测（纯函数镜像，供本地 Node 使用）。
 * 设备端由真实 hook 完成同样的事。
 */
export function detectLikeHook(
  samples: Float32Array,
  sampleRate: number = SELFTEST_SAMPLE_RATE,
  targetFreq?: number
): DetectionOutcome {
  const detector = new PitchDetector(sampleRate);
  const { frequency, confidence } = detector.processAudioData(samples, false);

  const empty: DetectionOutcome = { frequency: null, note: null, cents: null, status: 'error', confidence };
  if (!frequency || confidence < 0.4) return empty;
  if (frequency < TUNER_CONFIG.MIN_FREQ || frequency > TUNER_CONFIG.MAX_FREQ) return empty;

  const info = getNoteFromFrequency(frequency);
  const target = targetFreq && targetFreq > 0 ? targetFreq : frequency;
  const cents = Math.round(getCentsDeviation(frequency, target));

  return {
    frequency,
    note: `${info.note}${info.octave}`,
    cents,
    status: getTuningStatus(Math.abs(cents)),
    confidence,
  };
}

/** 用一条用例的期望值与一次检测结果做判定 */
export function evaluateCase(spec: SelfTestCaseSpec, outcome: DetectionOutcome): SelfTestResult {
  const { maxCentsError, minConfidence } = SELFTEST_LIMITS;
  const expectedHz = spec.silence ? 0 : spec.targetHz * ratioFromCents(spec.detuneCents);
  const reasons: string[] = [];

  if (spec.expectedNote === null) {
    // 静音用例：不应检出任何有效频率
    if (outcome.frequency !== null) {
      reasons.push(`静音不应检出频率，实际 ${outcome.frequency.toFixed(2)} Hz`);
    }
  } else {
    if (outcome.frequency === null) {
      reasons.push('未检出频率（信号被门限过滤或 YIN 未找到周期）');
    } else {
      if (outcome.note !== spec.expectedNote) {
        reasons.push(`音名期望 ${spec.expectedNote}，实际 ${outcome.note ?? '空'}`);
      }
      const err = getCentsDeviation(outcome.frequency, expectedHz);
      if (Math.abs(err) > maxCentsError) {
        reasons.push(`频率误差 ${err.toFixed(1)} 音分，超出 ±${maxCentsError}`);
      }
      const centsErr = (outcome.cents ?? 0) - spec.detuneCents;
      if (Math.abs(centsErr) > maxCentsError) {
        reasons.push(`音分读数 ${outcome.cents} 与期望 ${spec.detuneCents} 相差 ${centsErr.toFixed(0)}`);
      }
      if (outcome.confidence < minConfidence) {
        reasons.push(`置信度 ${outcome.confidence.toFixed(2)} 低于 ${minConfidence}`);
      }
    }
  }

  return {
    label: spec.label,
    expectedNote: spec.expectedNote,
    detectedNote: outcome.note,
    expectedHz: Math.round(expectedHz * 100) / 100,
    targetHz: spec.targetHz,
    detectedHz: outcome.frequency === null ? null : Math.round(outcome.frequency * 100) / 100,
    freqErrorCents:
      outcome.frequency === null || spec.silence
        ? null
        : Math.round(getCentsDeviation(outcome.frequency, expectedHz) * 10) / 10,
    cents: outcome.cents,
    expectedCents: spec.detuneCents,
    status: outcome.status,
    confidence: Math.round(outcome.confidence * 1000) / 1000,
    pass: reasons.length === 0,
    reasons,
  };
}

/** 汇总成报告 */
export function buildReport(
  cases: SelfTestResult[],
  sampleRate: number = SELFTEST_SAMPLE_RATE,
  windowSize: number = SELFTEST_WINDOW
): SelfTestReport {
  const passed = cases.filter((c) => c.pass).length;
  return {
    pass: passed === cases.length,
    passed,
    total: cases.length,
    sampleRate,
    windowSize,
    limits: { ...SELFTEST_LIMITS },
    cases,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 完整跑一遍自检（不依赖 React，可在 Node / 设备端复用）。
 * 设备端由 Runner 用真实 hook 驱动，此处用于本地与兜底校验。
 */
export function runSelfTest(
  sampleRate: number = SELFTEST_SAMPLE_RATE,
  windowSize: number = SELFTEST_WINDOW
): SelfTestReport {
  const results = SELF_TEST_CASES.map((spec) => {
    const pcm = spec.silence
      ? generateSilence(sampleRate, windowSize)
      : generatePluck(spec.targetHz * ratioFromCents(spec.detuneCents), sampleRate, windowSize);
    return evaluateCase(spec, detectLikeHook(pcm, sampleRate, spec.targetHz));
  });
  return buildReport(results, sampleRate, windowSize);
}

/** 摘要日志前缀：CI 只解析这一行，紧凑 JSON 不易被 logcat 截断 */
export const SELFTEST_SUMMARY_PREFIX = 'TUNER_SELFTEST_SUMMARY ';

export interface SelfTestSummary {
  pass: boolean;
  passed: number;
  total: number;
  /** 未通过用例的标签，便于 CI 直接定位 */
  failed: string[];
  /** 所有用例中最大的绝对频率误差（音分） */
  maxAbsCentsError: number | null;
  minConfidence: number;
}

/** 由完整报告生成紧凑摘要 */
export function buildSummary(report: SelfTestReport): SelfTestSummary {
  const errors = report.cases
    .map((c) => (c.freqErrorCents === null ? null : Math.abs(c.freqErrorCents)))
    .filter((v): v is number => v !== null);

  // 置信度只统计「应当检出音」的用例；静音用例本就应为 0，不参与
  const tonal = report.cases.filter((c) => c.expectedNote !== null);

  return {
    pass: report.pass,
    passed: report.passed,
    total: report.total,
    failed: report.cases.filter((c) => !c.pass).map((c) => c.label),
    maxAbsCentsError: errors.length ? Math.round(Math.max(...errors) * 100) / 100 : null,
    minConfidence: tonal.length
      ? Math.round(Math.min(...tonal.map((c) => c.confidence)) * 1000) / 1000
      : 0,
  };
}

/** 人类可读的报告文本（用于 console / 日志） */
export function formatReport(report: SelfTestReport): string {
  const lines: string[] = [];
  lines.push(`调音器自检 ${report.pass ? '✅ 通过' : '❌ 失败'}  ${report.passed}/${report.total}`);
  lines.push(`采样率 ${report.sampleRate}Hz · 窗长 ${report.windowSize} · 容差 ±${report.limits.maxCentsError} 音分 · 置信度 ≥${report.limits.minConfidence}`);
  for (const c of report.cases) {
    const mark = c.pass ? '✅' : '❌';
    const hz = c.detectedHz === null ? '—' : `${c.detectedHz}Hz`;
    const err = c.freqErrorCents === null ? '—' : `${c.freqErrorCents > 0 ? '+' : ''}${c.freqErrorCents}c`;
    lines.push(
      `  ${mark} ${c.label.padEnd(16)} 期望 ${String(c.expectedNote ?? '无声').padEnd(5)} 实测 ${String(c.detectedNote ?? '—').padEnd(5)} ${hz.padEnd(10)} 误差 ${err.padEnd(8)} 置信 ${c.confidence}${c.reasons.length ? '  ← ' + c.reasons.join('; ') : ''}`
    );
  }
  return lines.join('\n');
}

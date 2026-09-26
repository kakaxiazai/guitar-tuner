/**
 * 设备端调音器自检 Runner
 *
 * 在**真实设备**上驱动 `usePitchDetection`（真实 hook + 真实 YIN 实现），
 * 逐条喂入合成 PCM，读取 hook 输出的音名 / 音分 / 置信度并判定，
 * 最后把结构化结果打到 console —— Android 上会进入 logcat 的 `ReactNativeJS` 标签，
 * 由 `scripts/ci/tuner-selftest.sh` 解析断言。
 *
 * 这样，除了「麦克风硬件本身」，调音链路的所有环节
 * （React 状态机 → PitchDetector → 频率→音名 → 音分）都在真实设备上被验证过。
 *
 * 触发方式（Application 启动时读取深链）：
 *   adb shell am start -a android.intent.action.VIEW -d "guitartuner://selftest"
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePitchDetection } from '../hooks/usePitchDetection';
import {
  SELFTEST_LOG_TAG,
  SELFTEST_RESULT_PREFIX,
  SELFTEST_SAMPLE_RATE,
  SELFTEST_SUMMARY_PREFIX,
  SELFTEST_WINDOW,
  SELF_TEST_CASES,
  buildReport,
  buildSummary,
  evaluateCase,
  formatReport,
  generatePluck,
  generateSilence,
  ratioFromCents,
  type SelfTestReport,
  type SelfTestResult,
} from './tunerSelfTest';

/** 每条用例之间的等待：留出一次渲染 + 状态提交的时间 */
const STEP_DELAY_MS = 150;

export default function TunerSelfTestRunner() {
  const { frequency, note, cents, status, confidence, processAudioData, clear } =
    usePitchDetection();

  // 记录「最近一次渲染后」的状态，供异步循环读取
  const latestRef = useRef({ frequency, note, cents, status, confidence });
  latestRef.current = { frequency, note, cents, status, confidence };

  const [results, setResults] = useState<SelfTestResult[]>([]);
  const [report, setReport] = useState<SelfTestReport | null>(null);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    (async () => {
      console.log(
        `${SELFTEST_LOG_TAG}_BEGIN sr=${SELFTEST_SAMPLE_RATE} window=${SELFTEST_WINDOW} cases=${SELF_TEST_CASES.length}`
      );

      const collected: SelfTestResult[] = [];

      for (const spec of SELF_TEST_CASES) {
        if (cancelled) return;

        const pcm = spec.silence
          ? generateSilence(SELFTEST_SAMPLE_RATE, SELFTEST_WINDOW)
          : generatePluck(
              spec.targetHz * ratioFromCents(spec.detuneCents),
              SELFTEST_SAMPLE_RATE,
              SELFTEST_WINDOW
            );

        // clear() 会重置平滑历史 —— 否则上一条用例的频率会污染这一条的读数
        clear();
        processAudioData(pcm, spec.targetHz, false);
        await sleep(STEP_DELAY_MS);

        const snap = latestRef.current;
        const result = evaluateCase(spec, {
          frequency: snap.frequency,
          note: snap.note ? snap.note : null,
          cents: snap.cents,
          status: snap.status,
          // usePitchDetection 的 confidence 是 Math.round(conf * 100)，即 0~100 的整数百分比
          confidence: snap.confidence / 100,
        });

        collected.push(result);
        setResults([...collected]);

        console.log(
          `${SELFTEST_LOG_TAG} case=${result.label} pass=${result.pass} ` +
            `hz=${result.detectedHz ?? 'null'} note=${result.detectedNote ?? 'null'} ` +
            `err=${result.freqErrorCents ?? 'null'}c conf=${result.confidence}` +
            (result.reasons.length ? ` :: ${result.reasons.join('; ')}` : '')
        );
      }

      if (cancelled) return;

      const rep = buildReport(collected, SELFTEST_SAMPLE_RATE, SELFTEST_WINDOW);
      setReport(rep);
      setFinished(true);

      console.log(formatReport(rep));
      // 详细报告（人类可读，可能被 logcat 截断）
      console.log(SELFTEST_RESULT_PREFIX + JSON.stringify(rep));
      // 紧凑摘要（CI 只解析这一行）
      console.log(SELFTEST_SUMMARY_PREFIX + JSON.stringify(buildSummary(rep)));
      console.log(`${SELFTEST_LOG_TAG}_END pass=${rep.pass} ${rep.passed}/${rep.total}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [clear, processAudioData]);

  const passCount = results.filter((r) => r.pass).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>调音器自检</Text>
      <Text style={styles.subtitle}>
        {finished
          ? report?.pass
            ? `全部通过 ${passCount}/${results.length}`
            : `存在失败 ${passCount}/${results.length}`
          : `进行中 ${results.length}/${SELF_TEST_CASES.length}`}
      </Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {results.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={[styles.mark, r.pass ? styles.markOk : styles.markFail]}>
              {r.pass ? 'PASS' : 'FAIL'}
            </Text>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.detail}>
              {r.detectedNote ?? '—'} {r.detectedHz === null ? '' : `${r.detectedHz}Hz`}{' '}
              {r.freqErrorCents === null
                ? ''
                : `${r.freqErrorCents > 0 ? '+' : ''}${r.freqErrorCents}c`}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 48, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  subtitle: { fontSize: 14, color: '#5f6c7b', marginTop: 6, marginBottom: 12 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  mark: { width: 48, fontSize: 12, fontWeight: 'bold' },
  markOk: { color: '#27ae60' },
  markFail: { color: '#e74c3c' },
  label: { flex: 1, fontSize: 14, color: '#2c3e50' },
  detail: { fontSize: 13, color: '#5f6c7b' },
});

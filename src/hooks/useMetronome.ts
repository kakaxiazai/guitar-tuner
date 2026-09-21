import { useState, useRef, useCallback, useEffect } from 'react';
import { METRONOME_CONFIG } from '../constants/Settings';
import { SoundGenerator } from '../audio/SoundGenerator';

/**
 * 节拍器 Hook
 *
 * 说明：expo-av 无法像 Web Audio 那样做采样级精确调度，
 * 因此这里使用「定时器 + 细分步进」的方式驱动节拍：
 * - 每个 tick 播放一个最小节拍单位（一个细分）
 * - tick 间隔 = (60 / BPM) / subdivision 秒
 * - 每拍第一格为重音（小节第一拍），其余为普通拍；细分格播放细分音
 */
export function useMetronome() {
  const [bpm, setBpm] = useState<number>(METRONOME_CONFIG.DEFAULT_BPM);
  const [timeSignature, setTimeSignatureState] = useState<{ numerator: number; denominator: number }>({ numerator: 4, denominator: 4 });
  const [subdivision, setSubdivisionState] = useState<number>(1);
  const [soundType, setSoundType] = useState<string>('woodblock');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [totalBeats, setTotalBeats] = useState<number>(4);

  const soundGeneratorRef = useRef<SoundGenerator | null>(null);
  const timerIDRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef<number>(0); // 当前细分步：0 .. (subdivision * totalBeats - 1)

  // 使用 ref 保存最新参数，避免定时器回调中的闭包陈旧
  const bpmRef = useRef(bpm);
  const subdivisionRef = useRef(subdivision);
  const totalBeatsRef = useRef(totalBeats);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);
  useEffect(() => { totalBeatsRef.current = totalBeats; }, [totalBeats]);

  // 初始化音频生成器
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();
    return () => {
      soundGeneratorRef.current?.release();
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerIDRef.current) {
      clearInterval(timerIDRef.current);
      timerIDRef.current = null;
    }
  }, []);

  /** 播放一个细分步 */
  const playStep = useCallback(() => {
    const sub = Math.max(1, subdivisionRef.current);
    const total = Math.max(1, totalBeatsRef.current);
    const step = stepRef.current;

    const isBeatStart = step % sub === 0;
    const beatIndex = Math.floor(step / sub) % total;
    const isAccent = isBeatStart && beatIndex === 0;

    if (soundGeneratorRef.current) {
      // 不 await，避免阻塞定时器；失败静默忽略
      soundGeneratorRef.current
        .playMetronomeClick(isAccent, !isBeatStart)
        .catch(() => {});
    }

    if (isBeatStart) {
      setCurrentBeat(beatIndex + 1);
    }

    stepRef.current = (step + 1) % (sub * total);
  }, []);

  /** 根据当前 BPM / 细分重建定时器 */
  const startTimer = useCallback(() => {
    clearTimer();
    const intervalMs = ((60 / bpmRef.current) * 1000) / Math.max(1, subdivisionRef.current);
    timerIDRef.current = setInterval(playStep, intervalMs);
  }, [clearTimer, playStep]);

  /** 开始 */
  const start = useCallback(() => {
    if (timerIDRef.current) return;
    setIsPlaying(true);
    stepRef.current = 0;
    playStep();
    startTimer();
  }, [playStep, startTimer]);

  /** 停止 */
  const stop = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
    stepRef.current = 0;
    setCurrentBeat(0);
  }, [clearTimer]);

  /** 切换播放/暂停 */
  const toggle = useCallback(() => {
    if (timerIDRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // BPM / 细分变化时实时更新定时器频率（仅在播放中）
  useEffect(() => {
    if (timerIDRef.current) {
      startTimer();
    }
  }, [bpm, subdivision, startTimer]);

  // 卸载时清理
  useEffect(() => () => clearTimer(), [clearTimer]);

  /** 设置 BPM（限定范围） */
  const setBpmValue = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, newBpm));
    setBpm(clampedBpm);
  }, []);

  /** 设置节拍类型（同步更新总拍数） */
  const setTimeSignature = useCallback((ts: { numerator: number; denominator: number }) => {
    setTimeSignatureState(ts);
    setTotalBeats(ts.numerator);
    setCurrentBeat(0);
    stepRef.current = 0;
  }, []);

  /** 设置细分节拍 */
  const setSubdivisionValue = useCallback((sub: number) => {
    setSubdivisionState(sub);
    setCurrentBeat(0);
    stepRef.current = 0;
  }, []);

  /** 设置声音类型 */
  const setSoundTypeValue = useCallback((type: string) => {
    setSoundType(type);
  }, []);

  return {
    bpm,
    timeSignature,
    subdivision,
    soundType,
    isPlaying,
    currentBeat,
    totalBeats,
    start,
    stop,
    toggle,
    setBpmValue,
    setTimeSignature,
    setSubdivisionValue,
    setSoundTypeValue,
  };
}

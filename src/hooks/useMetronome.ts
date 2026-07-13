import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { METRONOME_CONFIG } from '../constants/Settings';
import { SoundGenerator } from '../audio/SoundGenerator';

/**
 * 节拍器 Hook
 */
export function useMetronome() {
  const [bpm, setBpm] = useState<number>(METRONOME_CONFIG.DEFAULT_BPM);
  const [timeSignature, setTimeSignature] = useState<{ numerator: number; denominator: number }>({ numerator: 4, denominator: 4 });
  const [subdivision, setSubdivision] = useState<number>(1);
  const [soundType, setSoundType] = useState<string>('woodblock');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [totalBeats, setTotalBeats] = useState<number>(4);

  const soundGeneratorRef = useRef<SoundGenerator | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<NodeJS.Timeout | null>(null);
  const current16thNoteRef = useRef<number>(0);
  const lookaheadRef = useRef<number>(25.0); // ms
  const scheduleAheadTimeRef = useRef<number>(0.1); // s

  // 初始化音频生成器
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();

    return () => {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.release();
      }
    };
  }, []);

  /**
   * 调度节拍
   */
  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    const beatInMeasure = beatNumber % totalBeats;
    const isAccent = beatInMeasure === 0;
    const isSubdivision = subdivision > 1 && beatNumber % subdivision !== 0;

    soundGeneratorRef.current?.playMetronomeClick(isAccent, isSubdivision);
  }, [totalBeats, soundType, subdivision]);

  /**
   * 下一个节拍时间计算
   */
  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    current16thNoteRef.current += 1 / subdivision;
  }, [bpm, subdivision]);

  /**
   * 调度所有即将到来的节拍
   */
  const scheduler = useCallback(() => {
    // 使用音频时间作为当前时间
    const now = nextNoteTimeRef.current > 0 ? nextNoteTimeRef.current : 0;
    while (nextNoteTimeRef.current < now + scheduleAheadTimeRef.current) {
      const beatNumber = current16thNoteRef.current;
      const beatInMeasure = Math.floor(beatNumber) % totalBeats;

      scheduleNote(beatNumber, nextNoteTimeRef.current);

      nextNote();

      // 更新当前节拍（仅视觉，不阻塞音频调度）
      if (beatInMeasure === 0 && Math.floor(current16thNoteRef.current) > 0) {
        setCurrentBeat(Math.floor(current16thNoteRef.current) + 1);
      }
    }
  }, [scheduleNote, nextNote, totalBeats]);

  /**
   * 开始节拍器
   */
  const start = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    current16thNoteRef.current = 0;
    nextNoteTimeRef.current = 0.1; // 给一点点缓冲时间
    scheduler();

    // 使用 setInterval 调度器（lookahead scheduling）
    timerIDRef.current = setInterval(() => {
      scheduler();
    }, lookaheadRef.current);
  }, [isPlaying, scheduler]);

  /**
   * 停止节拍器
   */
  const stop = useCallback(async () => {
    setIsPlaying(false);
    if (timerIDRef.current) {
      clearInterval(timerIDRef.current);
      timerIDRef.current = null;
    }
  }, []);

  /**
   * 切换播放/暂停
   */
  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  /**
   * 设置 BPM
   */
  const setBpmValue = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, newBpm));
    setBpm(clampedBpm);
  }, []);

  /**
   * 设置节拍类型
   */
  const setTimeSignatureValue = useCallback((ts: { numerator: number; denominator: number }) => {
    setTimeSignature(ts);
    setTotalBeats(ts.numerator);
    setCurrentBeat(0);
  }, []);

  /**
   * 设置细分节拍
   */
  const setSubdivisionValue = useCallback((sub: number) => {
    setSubdivision(sub);
    setCurrentBeat(0);
  }, []);

  /**
   * 设置声音类型
   */
  const setSoundTypeValue = useCallback((type: string) => {
    setSoundType(type);
  }, []);

  /**
   * 释放资源
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

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

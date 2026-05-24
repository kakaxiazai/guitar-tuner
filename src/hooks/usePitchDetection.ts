import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from '../audio/PitchDetector';
import { smoothFrequency } from '../utils/FrequencyUtils';
import { getNoteFromFrequency } from '../utils/NoteUtils';
import { TUNER_CONFIG } from '../constants/Settings';

/**
 * 音高检测 Hook
 * @returns 音高检测状态和方法
 */
export function usePitchDetection() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [status, setStatus] = useState<string>('error'); // 'perfect' | 'good' | 'warning' | 'error'

  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    pitchDetectorRef.current = new PitchDetector(TUNER_CONFIG.SAMPLE_RATE);
    return () => {
      pitchDetectorRef.current = null;
      historyRef.current = [];
    };
  }, []);

  const processAudioData = useCallback((data: Float32Array) => {
    if (!pitchDetectorRef.current) {
      return;
    }

    // 检测频率
    const detectedFreq = pitchDetectorRef.current.processAudioData(data);

    if (detectedFreq && detectedFreq >= TUNER_CONFIG.MIN_FREQ && detectedFreq <= TUNER_CONFIG.MAX_FREQ) {
      // 平滑频率
      const smoothedFreq = smoothFrequency(
        detectedFreq,
        historyRef.current,
        TUNER_CONFIG.SMOOTHING_WINDOW
      );

      // 计算音分偏差（相对于 E4 = 329.63Hz）
      const targetFreq = 329.63;
      const centsDev = Math.round(1200 * Math.log2(smoothedFreq / targetFreq));

      // 转换为音符
      const noteInfo = getNoteFromFrequency(smoothedFreq);

      // 更新状态
      setFrequency(smoothedFreq);
      setNote(`${noteInfo.note}${noteInfo.octave}`);
      setCents(centsDev);

      // 根据音分偏差设置状态
      const tuningStatus = getTuningStatus(Math.abs(centsDev));
      setStatus(tuningStatus);

      // 更新历史记录
      historyRef.current.push(smoothedFreq);
      if (historyRef.current.length > TUNER_CONFIG.SMOOTHING_WINDOW) {
        historyRef.current.shift();
      }
    } else {
      // 频率无效，清除状态
      setFrequency(null);
      setNote('');
      setCents(0);
      setStatus('error');
    }
  }, []);

  /**
   * 根据音分偏差设置调音状态
   */
  const getTuningStatus = useCallback((centsDev: number) => {
    if (centsDev < TUNER_CONFIG.PERFECT_THRESHOLD) {
      return 'perfect';
    } else if (centsDev < TUNER_CONFIG.GOOD_THRESHOLD) {
      return 'good';
    } else if (centsDev < TUNER_CONFIG.WARNING_THRESHOLD) {
      return 'warning';
    } else {
      return 'error';
    }
  }, []);

  /**
   * 清除检测结果
   */
  const clear = useCallback(() => {
    setFrequency(null);
    setNote('');
    setCents(0);
    setStatus('error');
    historyRef.current = [];
  }, []);

  /**
   * 设置目标频率（用于手动调音模式）
   */
  const setTargetFrequency = useCallback((freq: number) => {
    // 预留接口，暂不使用
  }, []);

  return {
    frequency,
    note,
    cents,
    status,
    processAudioData,
    clear,
    setTargetFrequency,
  };
}

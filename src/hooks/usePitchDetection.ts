import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from '../audio/PitchDetector';
import { smoothFrequency } from '../utils/FrequencyUtils';
import {
  getNoteFromFrequency,
  getCentsDeviation,
  getTuningStatus,
} from '../utils/NoteUtils';
import { TUNER_CONFIG } from '../constants/Settings';

/**
 * 音高检测 Hook - 使用 YIN 算法
 * @returns 音高检测状态和方法
 */
export function usePitchDetection() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [status, setStatus] = useState<string>('error');
  const [confidence, setConfidence] = useState<number>(0);

  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  const historyRef = useRef<number[]>([]);
  // 用于平滑的置信度历史
  const confidenceHistoryRef = useRef<number[]>([]);

  // 初始化音高检测器
  const initializePitchDetector = useCallback(() => {
    if (!pitchDetectorRef.current) {
      pitchDetectorRef.current = new PitchDetector(TUNER_CONFIG.SAMPLE_RATE);
    }
  }, []);

  /**
   * 处理音频数据
   */
  const processAudioData = useCallback((data: Float32Array, targetFreq?: number, autoGainEnabled?: boolean): void => {
    if (!pitchDetectorRef.current) {
      return;
    }

    // YIN 算法检测频率和置信度
    const { frequency: detectedFreq, confidence: conf } = pitchDetectorRef.current.processAudioData(data, autoGainEnabled ?? false);

    // 置信度太低，忽略结果
    if (!detectedFreq || conf < 0.4) {
      setFrequency(null);
      setNote('');
      setCents(0);
      setStatus('error');
      setConfidence(conf);
      return;
    }

    if (detectedFreq >= TUNER_CONFIG.MIN_FREQ && detectedFreq <= TUNER_CONFIG.MAX_FREQ) {
      // 平滑频率（仅在置信度高时）
      const smoothedFreq = smoothFrequency(
        detectedFreq,
        historyRef.current,
        TUNER_CONFIG.SMOOTHING_WINDOW
      );

      // 平滑置信度
      confidenceHistoryRef.current.push(conf);
      if (confidenceHistoryRef.current.length > 3) {
        confidenceHistoryRef.current.shift();
      }
      const avgConfidence = confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length;

      // 计算目标频率
      const targetFrequency = targetFreq ?? 329.63;

      // 计算音分偏差
      const centsDev = getCentsDeviation(smoothedFreq, targetFrequency);

      // 转换为音符
      const noteInfo = getNoteFromFrequency(smoothedFreq);

      // 更新状态
      setFrequency(smoothedFreq);
      setNote(`${noteInfo.note}${noteInfo.octave}`);
      setCents(Math.round(centsDev));
      setConfidence(Math.round(avgConfidence * 100));

      // 根据音分偏差设置状态
      const tuningStatus = getTuningStatus(Math.abs(centsDev));
      setStatus(tuningStatus);

      // 更新历史记录
      historyRef.current.push(smoothedFreq);
      if (historyRef.current.length > TUNER_CONFIG.SMOOTHING_WINDOW) {
        historyRef.current.shift();
      }
    } else {
      // 频率超出范围
      setFrequency(null);
      setNote('');
      setCents(0);
      setStatus('error');
      setConfidence(conf);
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
    setConfidence(0);
    historyRef.current = [];
    confidenceHistoryRef.current = [];
  }, []);

  /**
   * 释放资源
   */
  useEffect(() => {
    return () => {
      pitchDetectorRef.current = null;
      historyRef.current = [];
      confidenceHistoryRef.current = [];
    };
  }, []);

  return {
    frequency,
    note,
    cents,
    status,
    confidence,
    processAudioData,
    clear,
  };
}

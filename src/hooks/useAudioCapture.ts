import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { PitchDetector } from '../audio/PitchDetector';

/**
 * 音频采集 Hook
 * @returns 音频采集状态和方法
 */
export function useAudioCapture() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  const historyRef = useRef<number[]>([]);

  // 初始化音高检测器
  const initializePitchDetector = useCallback(() => {
    if (!pitchDetectorRef.current) {
      pitchDetectorRef.current = new PitchDetector(44100);
    }
  }, []);

  /**
   * 开始音频采集
   */
  const startRecording = useCallback(async () => {
    try {
      initializePitchDetector();

      // 请求麦克风权限
      const permissionStatus = await Audio.requestPermissionsAsync();
      if (!permissionStatus.granted) {
        console.error('麦克风权限未授予');
        return false;
      }

      setHasPermission(true);

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
      });

      // 创建录音
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          sampleRate: 44100,
          outputFormat: 0,
          audioEncoder: 0,
        },
        ios: {
          extension: '.wav',
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          audioQuality: 1,
        },
        web: {
          mimeType: 'audio/wav',
        },
      });

      recordingRef.current = recording;

      // 设置状态更新
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          // 音量检测（如果可用）
          // recordLevel 可能不存在于所有平台上
          const recordLevel = (status as any).recordLevel;
          if (recordLevel !== undefined && recordLevel !== null) {
            setAudioLevel(recordLevel / 255); // 归一化到 0-1
          }
        }
      });

      // 开始录音
      await recording.startAsync();

      setIsRecording(true);

      return true;
    } catch (error) {
      console.error('开始录音失败:', error);
      return false;
    }
  }, [initializePitchDetector]);

  /**
   * 停止音频采集
   */
  const stopRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    } finally {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      recordingRef.current = null;
      setIsRecording(false);
      setAudioLevel(0);
    }
  }, []);

  /**
   * 获取音高检测结果
   */
  const getPitchDetection = useCallback((data: Float32Array) => {
    if (!pitchDetectorRef.current) {
      return null;
    }

    const frequency = pitchDetectorRef.current.processAudioData(data);
    return frequency;
  }, []);

  /**
   * 处理音频数据（调用 Hook 外部的处理函数）
   */
  const processAudioData = useCallback((data: Float32Array, callback: (frequency: number | null) => void) => {
    const frequency = getPitchDetection(data);
    if (frequency) {
      // 添加到历史记录
      historyRef.current.push(frequency);
      if (historyRef.current.length > 10) {
        historyRef.current.shift();
      }

      callback(frequency);
    }
  }, [getPitchDetection]);

  /**
   * 释放资源
   */
  const release = useCallback(async () => {
    await stopRecording();
    pitchDetectorRef.current = null;
    historyRef.current = [];
  }, [stopRecording]);

  return {
    isCapturing: isRecording,
    hasPermission,
    audioLevel,
    startCapture: startRecording,
    stopCapture: stopRecording,
    processAudioData: (data: Float32Array) => {
      // 直接处理音频数据并返回频率
      if (!pitchDetectorRef.current) {
        return null;
      }
      const frequency = pitchDetectorRef.current.processAudioData(data);
      return frequency;
    },
    release,
  };
}

import { useCallback, useRef, useState } from 'react';
import { AudioStudioModule, useAudioRecorder } from '@siteed/audio-studio';
import { TUNER_CONFIG } from '../constants/Settings';

/**
 * 调音器音频采集 Hook
 *
 * 使用 @siteed/audio-studio 直接采集**原始 PCM（float32）流**：
 * - iOS / Android 一致拿到 `Float32Array`，彻底绕开「Android MediaRecorder
 *   不支持 WAV/PCM」导致的解析失败问题（旧实现写入的 .wav 实为 AAC 数据）。
 * - 流式回调，无需「录音 → 停 → 读文件 → 解析 WAV」的循环，
 *   采集延迟更低（约 100ms 一帧），既省电又省 IO。
 * - 采集不落盘（output.primary.enabled = false），仅做流式分析。
 */
export interface TunerAudioCaptureCallbacks {
  /** 收到一段 PCM 采样（Float32，取值范围 [-1, 1]） */
  onAudioData: (data: Float32Array) => void;
  /** 音频电平（0~1），可选 —— 用于可视化 */
  onAudioLevel?: (level: number) => void;
  /** 采集出错 */
  onError?: (error: Error) => void;
  /** 需要麦克风权限时回调（用于弹出授权引导） */
  onPermissionRequired?: () => void;
}

export interface TunerAudioCaptureHandle {
  /** 是否正在采集 */
  isCapturing: boolean;
  /** 开始采集；返回是否成功启动 */
  start: () => Promise<boolean>;
  /** 停止采集 */
  stop: () => Promise<void>;
}

export function useTunerAudioCapture(
  callbacks: TunerAudioCaptureCallbacks
): TunerAudioCaptureHandle {
  // 用 ref 保存最新回调，避免因回调变化反复重建 start
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const { startRecording, stopRecording } = useAudioRecorder();
  const [isCapturing, setIsCapturing] = useState(false);
  const capturingRef = useRef(false);

  const start = useCallback(async (): Promise<boolean> => {
    if (capturingRef.current) {
      return true;
    }

    try {
      // 1. 请求麦克风权限
      const permission = await AudioStudioModule.requestPermissionsAsync();
      if (!permission?.granted) {
        callbacksRef.current.onPermissionRequired?.();
        return false;
      }

      // 2. 启动流式采集（float32 → 直接得到 Float32Array）
      await startRecording({
        sampleRate: TUNER_CONFIG.SAMPLE_RATE as 44100,
        channels: 1,
        encoding: 'pcm_16bit',
        interval: 100,
        streamFormat: 'float32',
        // 仅做流式采集，不写音频文件
        output: { primary: { enabled: false } },
        // iOS：允许「录音 + 扬声器播放」并存（手动模式需边放参考音边收音）
        ios: {
          audioSession: {
            category: 'PlayAndRecord',
            categoryOptions: ['DefaultToSpeaker', 'AllowBluetooth'],
          },
        },
        onAudioStream: async (event) => {
          if (event.streamFormat !== 'float32') {
            return;
          }
          const samples = event.data as Float32Array;
          if (!samples || samples.length === 0) {
            return;
          }
          try {
            callbacksRef.current.onAudioData(samples);

            if (callbacksRef.current.onAudioLevel) {
              let sum = 0;
              for (let i = 0; i < samples.length; i++) {
                sum += samples[i] * samples[i];
              }
              const rms = Math.sqrt(sum / samples.length);
              callbacksRef.current.onAudioLevel(Math.min(1, rms * 3));
            }
          } catch (error) {
            callbacksRef.current.onError?.(
              error instanceof Error ? error : new Error(String(error))
            );
          }
        },
      });

      capturingRef.current = true;
      setIsCapturing(true);
      return true;
    } catch (error) {
      capturingRef.current = false;
      setIsCapturing(false);
      callbacksRef.current.onError?.(
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }, [startRecording]);

  const stop = useCallback(async (): Promise<void> => {
    try {
      if (capturingRef.current) {
        await stopRecording();
      }
    } catch {
      // 停止失败静默忽略，避免打断 UI
    } finally {
      capturingRef.current = false;
      setIsCapturing(false);
    }
  }, [stopRecording]);

  return { isCapturing, start, stop };
}

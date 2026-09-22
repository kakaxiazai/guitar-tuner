import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import TunerDisplay from '../components/tuner/TunerDisplay';
import NoteDisplay from '../components/tuner/NoteDisplay';
import StringSelector from '../components/tuner/StringSelector';
import TunerModeSwitch from '../components/tuner/TunerModeSwitch';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { useTunerAudioCapture } from '../hooks/useTunerAudioCapture';
import { SoundGenerator } from '../audio/SoundGenerator';
import { PitchDetector } from '../audio/PitchDetector';
import { useSettings } from '../hooks/useSettings';
import { getNoteFromFrequency } from '../utils/NoteUtils';

export default function TunerScreen() {
  const { settings } = useSettings();
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedString, setSelectedString] = useState<number>(6);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const {
    frequency: detectedFrequency,
    note: detectedNote,
    cents: detectedCents,
    status,
    confidence,
    processAudioData,
    clear,
  } = usePitchDetection();

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const selectedStringRef = useRef(selectedString);
  selectedStringRef.current = selectedString;
  const errorShownRef = useRef(false);

  const soundGeneratorRef = useRef(new SoundGenerator());

  // 音频采集（原始 PCM float32 流，跨平台可用）
  const { isCapturing, start: startCapture, stop: stopCapture } = useTunerAudioCapture({
    onAudioData: (data: Float32Array) => {
      const currentSettings = settingsRef.current;
      const currentMode = modeRef.current;
      const currentSelectedString = selectedStringRef.current;

      if (currentMode === 'manual' && currentSelectedString) {
        const strings = PitchDetector.getGuitarStrings();
        const selected = strings.find((s) => s.string === currentSelectedString);
        processAudioData(data, selected?.frequency, currentSettings.autoGain);
      } else {
        processAudioData(data, undefined, currentSettings.autoGain);
      }
    },
    onError: (error) => {
      // 只在非权限错误时记录，避免噪音
      if (!error.message.includes('权限') && !error.message.includes('permission')) {
        console.error('音频采集错误:', error);
      }
    },
    onPermissionRequired: () => {
      // 只显示一次权限引导，避免重复弹窗
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        setPermissionDenied(true);
      }
    },
  });

  // 处理音频数据并更新 UI
  useEffect(() => {
    if (mode === 'auto' && isCapturing) {
      setFrequency(detectedFrequency);
      setNote(detectedNote || '');
      if (detectedFrequency) {
        const strings = PitchDetector.getGuitarStrings();
        const noteInfo = getNoteFromFrequency(detectedFrequency);
        let nearestStringFreq = 329.63;
        for (const str of strings) {
          const strNote = getNoteFromFrequency(str.frequency);
          if (strNote.midiNote === noteInfo.midiNote) {
            nearestStringFreq = str.frequency;
            break;
          }
        }
        const adjustedCents = Math.round(1200 * Math.log2(detectedFrequency / nearestStringFreq));
        setCents(adjustedCents);
      } else {
        setCents(0);
      }
    }
  }, [mode, isCapturing, detectedFrequency, detectedNote]);

  // 音准触觉反馈
  const lastPerfectRef = useRef(false);
  useEffect(() => {
    if (status === 'perfect' && !lastPerfectRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    lastPerfectRef.current = status === 'perfect';
  }, [status]);

  // 播放参考音
  const playReferenceTone = async () => {
    try {
      await soundGeneratorRef.current.playGuitarString(selectedString);
    } catch (error) {
      console.error('播放参考音失败:', error);
    }
  };

  // 请求麦克风权限
  const requestMicrophonePermission = async () => {
    errorShownRef.current = false;
    setPermissionDenied(false);

    const success = await startCapture();
    if (!success) {
      setPermissionDenied(true);
      errorShownRef.current = true;
    }
  };

  // 打开应用设置
  const openAppSettings = () => {
    Linking.openSettings();
  };

  // 开始/停止采集
  const toggleRecording = async () => {
    if (isCapturing) {
      await stopCapture();
      clear();
      setFrequency(null);
      setNote('');
      setCents(0);
      errorShownRef.current = false;
    } else {
      errorShownRef.current = false;
      const success = await startCapture();
      if (!success) {
        setPermissionDenied(true);
        errorShownRef.current = true;
      }
    }
  };

  // 组件卸载时释放资源
  useEffect(() => {
    return () => {
      soundGeneratorRef.current.release();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>吉他调音器</Text>
        <TunerModeSwitch mode={mode} onModeChange={setMode} />
      </View>

      <ScrollView style={styles.mainContent}>
        {mode === 'auto' ? (
          <>
            <TunerDisplay frequency={frequency} cents={cents} note={note} confidence={confidence} />
            <NoteDisplay note={note} frequency={frequency} cents={cents} confidence={confidence} />
            {isCapturing && frequency && (
              <Text style={styles.statusText}>
                {status === 'perfect' && '✓ 完美音准！'}
                {status === 'good' && '↑ 接近音准'}
                {status === 'warning' && '↓ 需要调整'}
                {status === 'error' && '请拨动琴弦'}
              </Text>
            )}
            {permissionDenied && !isCapturing && (
              <View style={styles.permissionCard}>
                <Ionicons name="mic-off" size={40} color="#e74c3c" />
                <Text style={styles.permissionTitle}>需要麦克风权限</Text>
                <Text style={styles.permissionText}>
                  调音器需要访问麦克风来检测吉他音高
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestMicrophonePermission}>
                  <Text style={styles.permissionButtonText}>重新授权</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
                  <Text style={styles.settingsButtonText}>前往系统设置</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <StringSelector selectedString={selectedString} onStringChange={setSelectedString} />
            <TouchableOpacity style={styles.playButton} onPress={playReferenceTone}>
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.playButtonText}>播放参考音</Text>
            </TouchableOpacity>
            {isCapturing && frequency ? (
              <>
                <TunerDisplay frequency={frequency} cents={cents} note={note} confidence={confidence} />
                <NoteDisplay note={note} frequency={frequency} cents={cents} confidence={confidence} />
                <Text style={styles.statusText}>
                  {status === 'perfect' && '✓ 完美音准！'}
                  {status === 'good' && '↑ 接近音准'}
                  {status === 'warning' && '↓ 需要调整'}
                  {status === 'error' && '拨动琴弦以开始调音'}
                </Text>
              </>
            ) : permissionDenied && !isCapturing ? (
              <View style={styles.permissionCard}>
                <Ionicons name="mic-off" size={40} color="#e74c3c" />
                <Text style={styles.permissionTitle}>需要麦克风权限</Text>
                <Text style={styles.permissionText}>
                  调音器需要访问麦克风来检测吉他音高
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestMicrophonePermission}>
                  <Text style={styles.permissionButtonText}>重新授权</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
                  <Text style={styles.settingsButtonText}>前往系统设置</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.hintText}>选择琴弦后点击"开始"拨动琴弦进行调音</Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.recordButton, isCapturing && styles.recordingButton]}
          onPress={toggleRecording}
        >
          <Ionicons name={isCapturing ? "stop" : "mic"} size={24} color="white" />
          <Text style={styles.recordButtonText}>{isCapturing ? "停止" : "开始"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  mainContent: {
    flex: 1,
  },
  statusText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
  },
  settingsButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 14,
    borderRadius: 30,
    width: 140,
    elevation: 3,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#c0392b',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

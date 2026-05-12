import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TunerDisplay from '../components/tuner/TunerDisplay';
import NoteDisplay from '../components/tuner/NoteDisplay';
import StringSelector from '../components/tuner/StringSelector';
import TunerModeSwitch from '../components/tuner/TunerModeSwitch';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { AudioCapture } from '../audio/AudioCapture';
import { SoundGenerator } from '../audio/SoundGenerator';

export default function TunerScreen() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedString, setSelectedString] = useState<number>(6);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);

  // 音高检测 Hook
  const {
    frequency: detectedFrequency,
    note: detectedNote,
    cents: detectedCents,
    status,
    processAudioData,
    clear,
  } = usePitchDetection();

  // 音频采集实例
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // 播放参考音
  const soundGeneratorRef = useRef(new SoundGenerator());

  // 初始化音频采集
  useEffect(() => {
    audioCaptureRef.current = new AudioCapture(
      undefined, // 使用默认配置
      {
        onAudioData: (data: Float32Array) => {
          // 当音频数据到达时，调用音高检测
          processAudioData(data);
        },
        onError: (error) => {
          console.error('音频采集错误:', error);
          Alert.alert('错误', `音频采集失败: ${error.message}`);
        },
      }
    );

    return () => {
      if (audioCaptureRef.current) {
        audioCaptureRef.current.release();
      }
    };
  }, []);

  // 处理音频数据并更新 UI
  useEffect(() => {
    if (mode === 'auto' && isCapturing && detectedFrequency) {
      setFrequency(detectedFrequency);
      setNote(detectedNote || '');
      setCents(detectedCents);
    }
  }, [mode, isCapturing, detectedFrequency, detectedNote, detectedCents]);

  // 播放参考音
  const playReferenceTone = async () => {
    try {
      await soundGeneratorRef.current.playGuitarString(selectedString);
    } catch (error) {
      console.error('播放参考音失败:', error);
      Alert.alert('错误', '播放参考音失败');
    }
  };

  // 开始/停止采集
  const toggleRecording = async () => {
    if (isCapturing) {
      if (audioCaptureRef.current) {
        await audioCaptureRef.current.stop();
      }
      setIsCapturing(false);
      clear();
      setFrequency(null);
      setNote('');
      setCents(0);
    } else {
      if (audioCaptureRef.current) {
        const success = await audioCaptureRef.current.start();
        setIsCapturing(success);
        if (!success) {
          Alert.alert('错误', '无法启动音频采集，请检查麦克风权限');
        }
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
          // 自动调音模式
          <>
            <TunerDisplay frequency={frequency} cents={cents} note={note} />
            <NoteDisplay note={note} frequency={frequency} cents={cents} />
            {isCapturing && frequency && (
              <Text style={styles.statusText}>
                {status === 'perfect' && '✓ 完美音准！'}
                {status === 'good' && '↑ 接近音准'}
                {status === 'warning' && '↓ 需要调整'}
                {status === 'error' && '请拨动琴弦'}
              </Text>
            )}
          </>
        ) : (
          // 手动调音模式
          <>
            <StringSelector selectedString={selectedString} onStringChange={setSelectedString} />
            <TouchableOpacity style={styles.playButton} onPress={playReferenceTone}>
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.playButtonText}>播放参考音</Text>
            </TouchableOpacity>
            <NoteDisplay note={note} frequency={frequency} cents={cents} />
            <Text style={styles.hintText}>拨动琴弦并调节直到指针在中间</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mainContent: {
    flex: 1,
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    width: 120,
  },
  recordingButton: {
    backgroundColor: '#c0392b',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
});

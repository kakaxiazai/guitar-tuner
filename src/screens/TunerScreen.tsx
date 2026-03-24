import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TunerDisplay from '../components/tuner/TunerDisplay';
import NoteDisplay from '../components/tuner/NoteDisplay';
import StringSelector from '../components/tuner/StringSelector';
import TunerModeSwitch from '../components/tuner/TunerModeSwitch';
import { Audio } from 'expo-av';

export default function TunerScreen() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedString, setSelectedString] = useState<number>(6);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // 吉他标准调弦频率
  const stringFrequencies = {
    6: 82.41, // E2
    5: 110.00, // A2
    4: 146.83, // D3
    3: 196.00, // G3
    2: 246.94, // B3
    1: 329.63, // E4
  };

  // 播放参考音
  const playReferenceTone = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sine%20wave%20${stringFrequencies[selectedString]}Hz&image_size=square`,
        },
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing reference tone:', error);
    }
  };

  // 模拟音频检测
  useEffect(() => {
    if (mode === 'auto' && isRecording) {
      const interval = setInterval(() => {
        // 模拟频率检测
        const mockFreq = stringFrequencies[selectedString] + (Math.random() - 0.5) * 5;
        setFrequency(mockFreq);
        
        // 计算音分偏差
        const centsDeviation = 1200 * Math.log2(mockFreq / stringFrequencies[selectedString]);
        setCents(Math.round(centsDeviation));
        
        // 确定音符
        setNote(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'][6 - selectedString]);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [mode, isRecording, selectedString]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>吉他调音器</Text>
        <TunerModeSwitch mode={mode} onModeChange={setMode} />
      </View>

      <View style={styles.mainContent}>
        <TunerDisplay frequency={frequency} cents={cents} note={note} />
        <NoteDisplay note={note} frequency={frequency} cents={cents} />
      </View>

      <View style={styles.footer}>
        {mode === 'manual' && (
          <>
            <StringSelector selectedString={selectedString} onStringChange={setSelectedString} />
            <TouchableOpacity style={styles.playButton} onPress={playReferenceTone}>
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.playButtonText}>播放参考音</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
          <Text style={styles.recordButtonText}>{isRecording ? "停止" : "开始"}</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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

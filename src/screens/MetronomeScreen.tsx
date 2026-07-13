import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BeatIndicator from '../components/metronome/BeatIndicator';
import TimeSignatureSelector from '../components/metronome/TimeSignatureSelector';
import SubdivisionSelector from '../components/metronome/SubdivisionSelector';
import SoundTypeSelector from '../components/metronome/SoundTypeSelector';
import TapTempoButton from '../components/metronome/TapTempoButton';
import { useMetronome } from '../hooks/useMetronome';
import { useSettings } from '../hooks/useSettings';

export default function MetronomeScreen() {
  const {
    bpm,
    timeSignature,
    subdivision,
    soundType,
    isPlaying,
    currentBeat,
    totalBeats,
    toggle,
    setBpmValue,
    setTimeSignature,
    setSubdivisionValue,
    setSoundTypeValue,
  } = useMetronome();

  const { settings, setLastBpm, setLastTimeSignature } = useSettings();

  // 恢复上次使用的设置
  useEffect(() => {
    if (settings.lastBpm && settings.lastBpm > 0) {
      setBpmValue(settings.lastBpm);
    }
    if (settings.lastTimeSignature) {
      setTimeSignature(settings.lastTimeSignature);
    }
  }, []);

  // 保存 BPM 和节拍类型
  useEffect(() => {
    setLastBpm(bpm);
  }, [bpm, setLastBpm]);

  useEffect(() => {
    setLastTimeSignature(timeSignature);
  }, [timeSignature, setLastTimeSignature]);

  const adjustBpm = (delta: number) => {
    setBpmValue(bpm + delta);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>节拍器</Text>
      </View>

      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent}>
        <BeatIndicator
          currentBeat={currentBeat}
          totalBeats={totalBeats}
          isPlaying={isPlaying}
        />

        <View style={styles.bpmSection}>
          <Text style={styles.bpmLabel}>速度 (BPM)</Text>
          <View style={styles.bpmDisplay}>
            <TouchableOpacity
              style={styles.bpmButton}
              onPress={() => adjustBpm(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.bpmValueContainer}>
              <Text style={styles.bpmValue}>{bpm}</Text>
              <Text style={styles.bpmRange}>20 - 280</Text>
            </View>
            <TouchableOpacity
              style={styles.bpmButton}
              onPress={() => adjustBpm(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TimeSignatureSelector
            timeSignature={timeSignature}
            onTimeSignatureChange={setTimeSignature}
          />
          <SubdivisionSelector
            subdivision={subdivision}
            onSubdivisionChange={setSubdivisionValue}
          />
          <SoundTypeSelector
            soundType={soundType}
            onSoundTypeChange={setSoundTypeValue}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TapTempoButton onTempoChange={setBpmValue} />
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.stopButton]}
          onPress={toggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? "stop" : "play"}
            size={32}
            color="white"
          />
          <Text style={styles.playButtonText}>{isPlaying ? "停止" : "开始"}</Text>
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
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  bpmSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 24,
  },
  bpmLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bpmDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  bpmButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bpmValueContainer: {
    alignItems: 'center',
    minWidth: 100,
  },
  bpmValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 56,
  },
  bpmRange: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  controlsContainer: {
    width: '100%',
    marginTop: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 14,
    flex: 1,
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    elevation: 3,
    shadowColor: '#e74c3c',
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

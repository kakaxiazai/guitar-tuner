import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BeatIndicator from '../components/metronome/BeatIndicator';
import TimeSignatureSelector from '../components/metronome/TimeSignatureSelector';
import SubdivisionSelector from '../components/metronome/SubdivisionSelector';
import SoundTypeSelector from '../components/metronome/SoundTypeSelector';
import TapTempoButton from '../components/metronome/TapTempoButton';
import { useMetronome } from '../hooks/useMetronome';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>节拍器</Text>
      </View>

      <View style={styles.mainContent}>
        <BeatIndicator
          currentBeat={currentBeat}
          totalBeats={totalBeats}
          isPlaying={isPlaying}
        />

        <View style={styles.bpmContainer}>
          <Text style={styles.bpmLabel}>速度 (BPM)</Text>
          <Text style={styles.bpmValue}>{bpm}</Text>
          <View style={styles.bpmControls}>
            <TouchableOpacity
              style={styles.bpmButton}
              onPress={() => setBpmValue(bpm - 1)}
            >
              <Ionicons name="remove" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bpmButton}
              onPress={() => setBpmValue(bpm + 1)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.bpmRange}>
            {20} - 280 BPM
          </Text>
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
      </View>

      <View style={styles.footer}>
        <TapTempoButton onTempoChange={setBpmValue} />
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.stopButton]}
          onPress={toggle}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bpmContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 30,
  },
  bpmLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bpmValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  bpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bpmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpmRange: {
    fontSize: 14,
    color: '#999',
  },
  controlsContainer: {
    width: '100%',
    marginTop: 20,
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
    backgroundColor: '#27ae60',
    padding: 20,
    borderRadius: 10,
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

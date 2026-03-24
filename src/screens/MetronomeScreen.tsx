import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Slider } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BeatIndicator from '../components/metronome/BeatIndicator';
import TimeSignatureSelector from '../components/metronome/TimeSignatureSelector';
import SubdivisionSelector from '../components/metronome/SubdivisionSelector';
import SoundTypeSelector from '../components/metronome/SoundTypeSelector';
import TapTempoButton from '../components/metronome/TapTempoButton';
import { Audio } from 'expo-av';

export default function MetronomeScreen() {
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<{ numerator: number; denominator: number }>({ numerator: 4, denominator: 4 });
  const [subdivision, setSubdivision] = useState<number>(1);
  const [soundType, setSoundType] = useState<string>('woodblock');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [showTapTempo, setShowTapTempo] = useState<boolean>(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // 播放节拍声音
  const playBeat = async (isAccent: boolean) => {
    try {
      // 停止之前的声音
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // 创建新的声音
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${soundType} ${isAccent ? 'accent' : 'normal'} beat&image_size=square`,
        },
        { shouldPlay: true, volume: isAccent ? 1.0 : 0.7 }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('Error playing beat:', error);
    }
  };

  // 启动节拍器
  const startMetronome = () => {
    setIsPlaying(true);
    setCurrentBeat(1);

    const interval = setInterval(() => {
      const isAccent = currentBeat === 1;
      playBeat(isAccent);

      setCurrentBeat((prev) => {
        if (prev >= timeSignature.numerator) {
          return 1;
        }
        return prev + 1;
      });
    }, 60000 / bpm);

    intervalRef.current = interval;
  };

  // 停止节拍器
  const stopMetronome = async () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  // Tap Tempo功能
  const handleTap = () => {
    const now = Date.now();
    if (lastTapRef.current > 0) {
      const interval = now - lastTapRef.current;
      const newBpm = Math.round(60000 / interval);
      setBpm(newBpm);
      setShowTapTempo(true);
      
      // 3秒后隐藏Tap Tempo提示
      setTimeout(() => setShowTapTempo(false), 3000);
    }
    lastTapRef.current = now;
  };

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>节拍器</Text>
      </View>

      <View style={styles.mainContent}>
        <BeatIndicator 
          currentBeat={currentBeat} 
          totalBeats={timeSignature.numerator} 
          isPlaying={isPlaying} 
        />

        <View style={styles.bpmContainer}>
          <Text style={styles.bpmLabel}>速度 (BPM)</Text>
          <Text style={styles.bpmValue}>{bpm}</Text>
          <Slider
            style={styles.slider}
            minimumValue={20}
            maximumValue={280}
            value={bpm}
            onValueChange={setBpm}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#e0e0e0"
          />
        </View>

        {showTapTempo && (
          <View style={styles.tapTempoIndicator}>
            <Text style={styles.tapTempoText}>Tap Tempo: {bpm} BPM</Text>
          </View>
        )}

        <View style={styles.controlsContainer}>
          <TimeSignatureSelector 
            timeSignature={timeSignature} 
            onTimeSignatureChange={setTimeSignature} 
          />
          <SubdivisionSelector 
            subdivision={subdivision} 
            onSubdivisionChange={setSubdivision} 
          />
          <SoundTypeSelector 
            soundType={soundType} 
            onSoundTypeChange={setSoundType} 
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TapTempoButton onTap={handleTap} />
        <TouchableOpacity 
          style={[styles.playButton, isPlaying && styles.stopButton]}
          onPress={isPlaying ? stopMetronome : startMetronome}
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
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  tapTempoIndicator: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  tapTempoText: {
    color: 'white',
    fontWeight: 'bold',
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

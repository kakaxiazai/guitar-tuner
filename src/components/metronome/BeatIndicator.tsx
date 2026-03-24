import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface BeatIndicatorProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
}

export default function BeatIndicator({ currentBeat, totalBeats, isPlaying }: BeatIndicatorProps) {
  const animations = useRef<Animated.Value[]>([]);

  // 初始化动画值
  useEffect(() => {
    animations.current = Array(totalBeats).fill(0).map(() => new Animated.Value(0.7));
  }, [totalBeats]);

  // 播放节拍动画
  useEffect(() => {
    if (isPlaying) {
      // 重置所有节拍
      animations.current.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });

      // 高亮当前节拍
      const currentAnim = animations.current[currentBeat - 1];
      Animated.sequence([
        Animated.timing(currentAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(currentAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentBeat, isPlaying, totalBeats]);

  return (
    <View style={styles.container}>
      {Array(totalBeats).fill(0).map((_, index) => {
        const isCurrentBeat = index === currentBeat - 1;
        const isAccentBeat = index === 0;

        return (
          <Animated.View
            key={index}
            style={[
              styles.beatCircle,
              isAccentBeat && styles.accentCircle,
              isCurrentBeat && styles.currentBeatCircle,
              {
                transform: [{ scale: animations.current[index] || 0.7 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  beatCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  accentCircle: {
    backgroundColor: '#3498db',
  },
  currentBeatCircle: {
    backgroundColor: '#27ae60',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TunerDisplayProps {
  frequency: number | null;
  cents: number;
  note: string;
  confidence: number;
}

export default function TunerDisplay({ frequency, cents, note, confidence }: TunerDisplayProps) {
  const needleRotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const wasPerfectRef = useRef(false);

  // 平滑动画过渡
  useEffect(() => {
    const targetRotation = Math.max(-45, Math.min(45, (cents / 50) * 45));

    Animated.spring(needleRotation, {
      toValue: targetRotation,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 音准时缩放动画（仅在状态变化时触发）
    const isPerfect = Math.abs(cents) < 5 && frequency;
    if (isPerfect && !wasPerfectRef.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    wasPerfectRef.current = !!isPerfect;
  }, [cents, frequency]);

  const getNeedleColor = () => {
    if (Math.abs(cents) < 5) return '#27ae60';
    if (Math.abs(cents) < 15) return '#f39c12';
    return '#e74c3c';
  };

  const getNoteColor = () => {
    if (Math.abs(cents) < 5) return '#27ae60';
    if (Math.abs(cents) < 15) return '#f39c12';
    return '#e74c3c';
  };

  const getConfidenceColor = () => {
    if (confidence >= 80) return '#27ae60';
    if (confidence >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* 调音仪表 */}
      <View style={styles.gaugeContainer}>
        {/* 刻度线 */}
        <View style={styles.scaleContainer}>
          {[...Array(11)].map((_, i) => {
            const position = -50 + i * 10;
            const isMajor = position % 25 === 0;
            return (
              <View key={i} style={[styles.scaleMark, { left: `${5 + (position / 100) * 45}%` }]}>
                <View style={[styles.scaleLine, isMajor && styles.majorScaleLine]} />
                {isMajor && (
                  <Text style={styles.scaleLabel}>
                    {position > 0 ? `+${position}` : position}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* 仪表中心区域 */}
        <View style={styles.gaugeArc}>
          {/* 绿色区域（音准区） */}
          <View style={styles.greenZone} />
          {/* 指针 */}
          <Animated.View
            style={[
              styles.needle,
              {
                transform: [{
                  rotate: needleRotation.interpolate({
                    inputRange: [-45, 0, 45],
                    outputRange: ['-45deg', '0deg', '45deg'],
                  }),
                }],
                backgroundColor: getNeedleColor(),
              },
            ]}
          />
          {/* 中心点 */}
          <View style={styles.needleCenter} />
        </View>
      </View>

      {/* 置信度指示器 */}
      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>检测精度</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {
                backgroundColor: getConfidenceColor(),
                width: `${confidence}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.confidenceValue, { color: getConfidenceColor() }]}>
          {confidence}%
        </Text>
      </View>

      {/* 音符显示 */}
      <View style={styles.noteContainer}>
        <Text style={[styles.noteText, { color: frequency ? getNoteColor() : '#999' }]}>
          {note || '--'}
        </Text>
        {frequency && (
          <Text style={styles.frequencyText}>{frequency.toFixed(1)} Hz</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gaugeContainer: {
    width: 320,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleContainer: {
    position: 'absolute',
    width: '100%',
    height: 40,
    top: 0,
  },
  scaleMark: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
  },
  scaleLine: {
    width: 1,
    height: 8,
    backgroundColor: '#ccc',
  },
  majorScaleLine: {
    width: 2,
    height: 14,
    backgroundColor: '#999',
  },
  scaleLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  gaugeArc: {
    width: 300,
    height: 140,
    backgroundColor: '#f8f9fa',
    borderRadius: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  greenZone: {
    position: 'absolute',
    top: 10,
    left: '42%',
    width: '16%',
    height: 50,
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 8,
  },
  needle: {
    position: 'absolute',
    bottom: 20,
    width: 3,
    height: 100,
    borderRadius: 2,
    backgroundColor: '#e74c3c',
    transformOrigin: 'bottom center',
  },
  needleCenter: {
    position: 'absolute',
    bottom: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    marginTop: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
    width: 50,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    width: 35,
    textAlign: 'right',
  },
  noteContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  noteText: {
    fontSize: 56,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  frequencyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
});

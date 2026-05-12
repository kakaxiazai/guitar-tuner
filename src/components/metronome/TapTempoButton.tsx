import React, { useState, useRef, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { METRONOME_CONFIG } from '../../constants/Settings';

interface TapTempoButtonProps {
  onTempoChange: (bpm: number) => void;
}

export default function TapTempoButton({ onTempoChange }: TapTempoButtonProps) {
  const [tapCount, setTapCount] = useState(0);
  
  // 使用 ref 避免闭包问题
  const lastTapTimesRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleTap = useCallback(() => {
    const now = Date.now();
    const times = lastTapTimesRef.current;
    
    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 如果距离上次 tap 超过 1.5 秒，重新开始
    if (times.length > 0 && now - times[times.length - 1] > METRONOME_CONFIG.TAP_TEMO_DEBOUNCE_MS) {
      times.length = 0;
      setTapCount(0);
    }
    
    // 记录当前 tap 时间
    times.push(now);
    setTapCount(times.length);
    
    // 保持最近 8 次 tap
    if (times.length > 8) {
      times.shift();
    }
    
    // 需要至少 2 次 tap 才能计算 BPM
    if (times.length >= 2) {
      // 计算平均间隔
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // 计算 BPM
      const bpm = Math.round(60000 / avgInterval);
      
      // 限制范围
      const clampedBpm = Math.max(
        METRONOME_CONFIG.MIN_BPM, 
        Math.min(METRONOME_CONFIG.MAX_BPM, bpm)
      );
      
      onTempoChange(clampedBpm);
    }
    
    // 1.5秒后重置计数
    timeoutRef.current = setTimeout(() => {
      times.length = 0;
      setTapCount(0);
    }, METRONOME_CONFIG.TAP_TEMO_DEBOUNCE_MS);
    
  }, [onTempoChange]);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleTap}
      activeOpacity={0.7}
    >
      <Ionicons name="pulse" size={20} color="white" />
      <Text style={styles.text}>Tap Tempo</Text>
      {tapCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.count}>{tapCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  count: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

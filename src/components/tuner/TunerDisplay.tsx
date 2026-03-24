import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TunerDisplayProps {
  frequency: number | null;
  cents: number;
  note: string;
}

export default function TunerDisplay({ frequency, cents, note }: TunerDisplayProps) {
  const getNeedlePosition = () => {
    if (cents === undefined) return 0;
    // 将音分偏差映射到-1到1之间
    return Math.max(-1, Math.min(1, cents / 50));
  };

  const getNeedleColor = () => {
    if (Math.abs(cents) < 5) return '#27ae60'; // 绿色，音准
    if (Math.abs(cents) < 15) return '#f39c12'; // 黄色，接近
    return '#e74c3c'; // 红色，偏差大
  };

  return (
    <View style={styles.container}>
      <View style={styles.gauge}>
        <View style={styles.scale}>
          <Text style={styles.scaleLabel}>-50</Text>
          <Text style={styles.scaleLabel}>0</Text>
          <Text style={styles.scaleLabel}>+50</Text>
        </View>
        <View style={styles.needleContainer}>
          <View 
            style={[
              styles.needle, 
              { 
                transform: [{ rotate: `${getNeedlePosition() * 45}deg` }],
                backgroundColor: getNeedleColor()
              }
            ]}
          />
        </View>
      </View>
      <Text style={styles.note}>{note || '--'}</Text>
      <Text style={styles.cents}>{cents ? `${cents > 0 ? '+' : ''}${cents} 音分` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gauge: {
    width: 300,
    height: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#666',
  },
  needleContainer: {
    position: 'relative',
    height: 80,
    alignItems: 'center',
  },
  needle: {
    width: 2,
    height: 80,
    backgroundColor: '#e74c3c',
    position: 'absolute',
    top: 0,
  },
  note: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  cents: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
});

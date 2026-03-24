import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NoteDisplayProps {
  note: string;
  frequency: number | null;
  cents: number;
}

export default function NoteDisplay({ note, frequency, cents }: NoteDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>音符:</Text>
        <Text style={styles.value}>{note || '--'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>频率:</Text>
        <Text style={styles.value}>{frequency ? frequency.toFixed(2) + ' Hz' : '--'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>偏差:</Text>
        <Text style={[styles.value, { color: Math.abs(cents) < 5 ? '#27ae60' : Math.abs(cents) < 15 ? '#f39c12' : '#e74c3c' }]}>
          {cents ? `${cents > 0 ? '+' : ''}${cents} 音分` : '--'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

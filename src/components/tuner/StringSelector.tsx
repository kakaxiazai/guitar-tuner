import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StringSelectorProps {
  selectedString: number;
  onStringChange: (string: number) => void;
}

export default function StringSelector({ selectedString, onStringChange }: StringSelectorProps) {
  const strings = [
    { number: 6, note: 'E2', frequency: '82' },
    { number: 5, note: 'A2', frequency: '110' },
    { number: 4, note: 'D3', frequency: '147' },
    { number: 3, note: 'G3', frequency: '196' },
    { number: 2, note: 'B3', frequency: '247' },
    { number: 1, note: 'E4', frequency: '330' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>选择琴弦</Text>
      <View style={styles.stringContainer}>
        {strings.map((string) => (
          <TouchableOpacity
            key={string.number}
            style={[
              styles.stringButton,
              selectedString === string.number && styles.selectedStringButton,
            ]}
            onPress={() => onStringChange(string.number)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.stringNumber,
                selectedString === string.number && styles.selectedStringText,
              ]}
            >
              {string.number}
            </Text>
            <Text
              style={[
                styles.stringNote,
                selectedString === string.number && styles.selectedStringText,
              ]}
            >
              {string.note}
            </Text>
            <Text
              style={[
                styles.stringFreq,
                selectedString === string.number && styles.selectedFreqText,
              ]}
            >
              {string.frequency}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stringButton: {
    width: 48,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedStringButton: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
    elevation: 3,
    shadowColor: '#3498db',
    shadowOpacity: 0.3,
  },
  stringNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stringNote: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  stringFreq: {
    fontSize: 9,
    color: '#bbb',
    marginTop: 1,
  },
  selectedStringText: {
    color: 'white',
  },
  selectedFreqText: {
    color: 'rgba(255,255,255,0.8)',
  },
});

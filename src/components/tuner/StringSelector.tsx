import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StringSelectorProps {
  selectedString: number;
  onStringChange: (string: number) => void;
}

export default function StringSelector({ selectedString, onStringChange }: StringSelectorProps) {
  const strings = [
    { number: 6, note: 'E2', frequency: '82.41 Hz' },
    { number: 5, note: 'A2', frequency: '110.00 Hz' },
    { number: 4, note: 'D3', frequency: '146.83 Hz' },
    { number: 3, note: 'G3', frequency: '196.00 Hz' },
    { number: 2, note: 'B3', frequency: '246.94 Hz' },
    { number: 1, note: 'E4', frequency: '329.63 Hz' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>选择琴弦:</Text>
      <View style={styles.stringContainer}>
        {strings.map((string) => (
          <TouchableOpacity
            key={string.number}
            style={[
              styles.stringButton,
              selectedString === string.number && styles.selectedStringButton,
            ]}
            onPress={() => onStringChange(string.number)}
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
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  stringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stringButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStringButton: {
    backgroundColor: '#3498db',
  },
  stringNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stringNote: {
    fontSize: 12,
    color: '#666',
  },
  selectedStringText: {
    color: 'white',
  },
});

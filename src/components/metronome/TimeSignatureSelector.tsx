import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TimeSignatureSelectorProps {
  timeSignature: { numerator: number; denominator: number };
  onTimeSignatureChange: (timeSignature: { numerator: number; denominator: number }) => void;
}

export default function TimeSignatureSelector({ timeSignature, onTimeSignatureChange }: TimeSignatureSelectorProps) {
  const timeSignatures = [
    { numerator: 2, denominator: 4 },
    { numerator: 3, denominator: 4 },
    { numerator: 4, denominator: 4 },
    { numerator: 5, denominator: 4 },
    { numerator: 6, denominator: 8 },
    { numerator: 7, denominator: 8 },
    { numerator: 9, denominator: 8 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>节拍类型</Text>
      <View style={styles.buttonContainer}>
        {timeSignatures.map((ts) => (
          <TouchableOpacity
            key={`${ts.numerator}/${ts.denominator}`}
            style={[
              styles.button,
              timeSignature.numerator === ts.numerator && timeSignature.denominator === ts.denominator && styles.activeButton,
            ]}
            onPress={() => onTimeSignatureChange(ts)}
          >
            <Text
              style={[
                styles.buttonText,
                timeSignature.numerator === ts.numerator && timeSignature.denominator === ts.denominator && styles.activeButtonText,
              ]}
            >
              {ts.numerator}/{ts.denominator}
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
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

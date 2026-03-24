import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SubdivisionSelectorProps {
  subdivision: number;
  onSubdivisionChange: (subdivision: number) => void;
}

export default function SubdivisionSelector({ subdivision, onSubdivisionChange }: SubdivisionSelectorProps) {
  const subdivisions = [
    { value: 1, label: '1/4' },
    { value: 2, label: '1/8' },
    { value: 3, label: '1/8 triplet' },
    { value: 4, label: '1/16' },
    { value: 6, label: '1/16 triplet' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>节拍细分</Text>
      <View style={styles.buttonContainer}>
        {subdivisions.map((sub) => (
          <TouchableOpacity
            key={sub.value}
            style={[
              styles.button,
              subdivision === sub.value && styles.activeButton,
            ]}
            onPress={() => onSubdivisionChange(sub.value)}
          >
            <Text
              style={[
                styles.buttonText,
                subdivision === sub.value && styles.activeButtonText,
              ]}
            >
              {sub.label}
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

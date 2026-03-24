import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SoundTypeSelectorProps {
  soundType: string;
  onSoundTypeChange: (soundType: string) => void;
}

export default function SoundTypeSelector({ soundType, onSoundTypeChange }: SoundTypeSelectorProps) {
  const soundTypes = [
    { value: 'woodblock', label: '木鱼' },
    { value: 'electronic', label: '电子' },
    { value: 'drum', label: '鼓' },
    { value: 'bell', label: '铃' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>声音类型</Text>
      <View style={styles.buttonContainer}>
        {soundTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.button,
              soundType === type.value && styles.activeButton,
            ]}
            onPress={() => onSoundTypeChange(type.value)}
          >
            <Text
              style={[
                styles.buttonText,
                soundType === type.value && styles.activeButtonText,
              ]}
            >
              {type.label}
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

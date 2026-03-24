import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TunerModeSwitchProps {
  mode: 'auto' | 'manual';
  onModeChange: (mode: 'auto' | 'manual') => void;
}

export default function TunerModeSwitch({ mode, onModeChange }: TunerModeSwitchProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'auto' && styles.activeButton,
        ]}
        onPress={() => onModeChange('auto')}
      >
        <Text
          style={[
            styles.buttonText,
            mode === 'auto' && styles.activeButtonText,
          ]}
        >
          自动
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'manual' && styles.activeButton,
        ]}
        onPress={() => onModeChange('manual')}
      >
        <Text
          style={[
            styles.buttonText,
            mode === 'manual' && styles.activeButtonText,
          ]}
        >
          手动
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

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
        activeOpacity={0.7}
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
        activeOpacity={0.7}
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
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
    padding: 3,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#3498db',
    elevation: 1,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});

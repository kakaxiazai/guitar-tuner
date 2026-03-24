import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TapTempoButtonProps {
  onTap: () => void;
}

export default function TapTempoButton({ onTap }: TapTempoButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onTap}>
      <Text style={styles.buttonText}>Tap Tempo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#95a5a6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

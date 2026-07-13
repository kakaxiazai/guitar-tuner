import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NoteDisplayProps {
  note: string;
  frequency: number | null;
  cents: number;
  confidence: number;
}

export default function NoteDisplay({ note, frequency, cents, confidence }: NoteDisplayProps) {
  const getCentsColor = () => {
    const absCents = Math.abs(cents);
    if (absCents < 5) return '#27ae60';
    if (absCents < 15) return '#f39c12';
    return '#e74c3c';
  };

  const getCentsLabel = () => {
    const absCents = Math.abs(cents);
    if (absCents === 0) return '完美';
    if (absCents < 5) return '音准';
    if (absCents < 10) return '接近';
    if (absCents < 25) return '需调整';
    return '偏差大';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 80) return '高';
    if (confidence >= 60) return '中';
    return '低';
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>音符</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, note ? styles.highlightedValue : {}]}>
            {note || '--'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>频率</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>
            {frequency ? `${frequency.toFixed(1)} Hz` : '--'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>偏差</Text>
        </View>
        <View style={[styles.centsIndicator, { backgroundColor: `${getCentsColor()}20` }]}>
          <View
            style={[
              styles.centsBar,
              {
                backgroundColor: getCentsColor(),
                width: Math.min(100, (Math.abs(cents) / 50) * 100),
              },
            ]}
          />
          <Text style={[styles.centsText, { color: getCentsColor() }]}>
            {cents !== 0 ? `${cents > 0 ? '+' : ''}${cents} cent` : '--'}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: `${getCentsColor()}20` }]}>
          <Text style={[styles.statusText, { color: getCentsColor() }]}>
            {getCentsLabel()}
          </Text>
        </View>
        <View style={[
          styles.confidenceBadge,
          { backgroundColor: confidence >= 80 ? '#27ae6020' : confidence >= 60 ? '#f39c1220' : '#e74c3c20' }
        ]}>
          <Text style={[
            styles.confidenceText,
            { color: confidence >= 80 ? '#27ae60' : confidence >= 60 ? '#f39c12' : '#e74c3c' }
          ]}>
            精度: {getConfidenceLabel()} ({confidence}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  highlightedValue: {
    fontSize: 22,
    color: '#27ae60',
  },
  centsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
    minWidth: 100,
  },
  centsBar: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  centsText: {
    fontSize: 15,
    fontWeight: '600',
    zIndex: 1,
  },
  statusRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  confidenceBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [referencePitch, setReferencePitch] = useState<number>(440);
  const [autoGain, setAutoGain] = useState<boolean>(true);

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkText]}>设置</Text>
      </View>

      <View style={styles.settingsList}>
        <View style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={24} color={darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>深色模式</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={darkMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="musical-note" size={24} color={darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>参考音高 (A4)</Text>
          </View>
          <Text style={[styles.settingValue, darkMode && styles.darkText]}>{referencePitch} Hz</Text>
        </View>

        <View style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="mic" size={24} color={darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>自动增益</Text>
          </View>
          <Switch
            value={autoGain}
            onValueChange={setAutoGain}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={autoGain ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle" size={24} color={darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>使用帮助</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? '#fff' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, darkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle" size={24} color={darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>关于</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? '#fff' : '#666'} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, darkMode && styles.darkText]}>版本 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#2c3e50',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
  },
  darkHeader: {
    backgroundColor: '#34495e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  settingsList: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  darkSettingItem: {
    backgroundColor: '#34495e',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
});

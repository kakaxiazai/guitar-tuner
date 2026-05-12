import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSettings } from '../hooks/useSettings';

export default function SettingsScreen() {
  const { 
    settings, 
    isLoaded,
    setDarkMode, 
    setReferencePitch, 
    setAutoGain 
  } = useSettings();
  
  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <Text>加载中...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={[
      styles.container, 
      settings.darkMode && styles.darkContainer
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, settings.darkMode && styles.darkText]}>设置</Text>
      </View>

      <View style={styles.settingsList}>
        {/* 深色模式 */}
        <View style={[
          styles.settingItem, 
          settings.darkMode && styles.darkSettingItem
        ]}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={24} color={settings.darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, settings.darkMode && styles.darkText]}>
              深色模式
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={settings.darkMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* 参考音高 */}
        <View style={[
          styles.settingItem, 
          settings.darkMode && styles.darkSettingItem,
          styles.settingColumn
        ]}>
          <View style={styles.settingInfo}>
            <Ionicons name="musical-note" size={24} color={settings.darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, settings.darkMode && styles.darkText]}>
              参考音高 (A4)
            </Text>
          </View>
          <Text style={[styles.settingValue, settings.darkMode && styles.darkText]}>
            {settings.referencePitch} Hz
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={415}
            maximumValue={460}
            step={1}
            value={settings.referencePitch}
            onValueChange={setReferencePitch}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor="#3498db"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>415 Hz</Text>
            <Text style={styles.sliderLabel}>460 Hz</Text>
          </View>
        </View>

        {/* 自动增益 */}
        <View style={[
          styles.settingItem, 
          settings.darkMode && styles.darkSettingItem
        ]}>
          <View style={styles.settingInfo}>
            <Ionicons name="mic" size={24} color={settings.darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, settings.darkMode && styles.darkText]}>
              自动增益
            </Text>
          </View>
          <Switch
            value={settings.autoGain}
            onValueChange={setAutoGain}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={settings.autoGain ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* 使用帮助 */}
        <TouchableOpacity style={[
          styles.settingItem, 
          settings.darkMode && styles.darkSettingItem
        ]}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle" size={24} color={settings.darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, settings.darkMode && styles.darkText]}>
              使用帮助
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={settings.darkMode ? '#fff' : '#666'} />
        </TouchableOpacity>

        {/* 关于 */}
        <TouchableOpacity style={[
          styles.settingItem, 
          settings.darkMode && styles.darkSettingItem
        ]}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle" size={24} color={settings.darkMode ? '#fff' : '#333'} />
            <Text style={[styles.settingLabel, settings.darkMode && styles.darkText]}>
              关于
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={settings.darkMode ? '#fff' : '#666'} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, settings.darkMode && styles.darkText]}>
          版本 1.0.0
        </Text>
      </View>
    </ScrollView>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
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
  settingColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
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
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
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

import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSettings } from '../hooks/useSettings';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const {
    settings,
    isLoaded,
    setDarkMode,
    setReferencePitch,
    setAutoGain,
  } = useSettings();

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const handleToggle = async (key: 'darkMode' | 'autoGain', value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'darkMode') {
      setDarkMode(value);
    } else {
      setAutoGain(value);
    }
  };

  return (
    <ScrollView style={[
      styles.container,
      settings.darkMode && styles.darkContainer
    ]}>
      <View style={[styles.header, settings.darkMode && styles.darkHeader]}>
        <Text style={[styles.title, settings.darkMode && styles.darkText]}>设置</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, settings.darkMode && styles.darkSectionTitle]}>
          调音设置
        </Text>

        {/* 参考音高 */}
        <View style={[styles.card, settings.darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-note" size={22} color={settings.darkMode ? '#3498db' : '#3498db'} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, settings.darkMode && styles.darkText]}>
                参考音高 (A4)
              </Text>
              <Text style={[styles.cardDescription, settings.darkMode && styles.darkSubText]}>
                标准音 A4 频率，范围 415-460 Hz
              </Text>
            </View>
            <Text style={[styles.valueBadge, settings.darkMode && styles.darkValueBadge]}>
              {settings.referencePitch} Hz
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderMin}>415</Text>
            <Slider
              style={styles.slider}
              minimumValue={415}
              maximumValue={460}
              step={1}
              value={settings.referencePitch}
              onValueChange={setReferencePitch}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor={settings.darkMode ? '#4a5568' : '#e0e0e0'}
              thumbTintColor="#3498db"
            />
            <Text style={styles.sliderMax}>460</Text>
          </View>
        </View>

        {/* 自动增益 */}
        <View style={[styles.card, settings.darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="mic" size={22} color="#3498db" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, settings.darkMode && styles.darkText]}>
                自动增益
              </Text>
              <Text style={[styles.cardDescription, settings.darkMode && styles.darkSubText]}>
                自动调整麦克风输入音量
              </Text>
            </View>
            <Switch
              value={settings.autoGain}
              onValueChange={(value) => handleToggle('autoGain', value)}
              trackColor={{ false: settings.darkMode ? '#4a5568' : '#e0e0e0', true: '#3498db' }}
              thumbColor={settings.autoGain ? '#fff' : '#ccc'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, settings.darkMode && styles.darkSectionTitle]}>
          外观
        </Text>

        {/* 深色模式 */}
        <View style={[styles.card, settings.darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={settings.darkMode ? 'moon' : 'sunny'}
                size={22}
                color="#f39c12"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, settings.darkMode && styles.darkText]}>
                深色模式
              </Text>
              <Text style={[styles.cardDescription, settings.darkMode && styles.darkSubText]}>
                适合暗光环境下使用
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleToggle('darkMode', value)}
              trackColor={{ false: settings.darkMode ? '#4a5568' : '#e0e0e0', true: '#3498db' }}
              thumbColor={settings.darkMode ? '#fff' : '#ccc'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, settings.darkMode && styles.darkSectionTitle]}>
          关于
        </Text>

        <TouchableOpacity style={[styles.card, settings.darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-circle" size={22} color="#9b59b6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, settings.darkMode && styles.darkText]}>
                使用帮助
              </Text>
              <Text style={[styles.cardDescription, settings.darkMode && styles.darkSubText]}>
                如何正确使用调音器和节拍器
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={settings.darkMode ? '#666' : '#ccc'}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, settings.darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle" size={22} color="#27ae60" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, settings.darkMode && styles.darkText]}>
                关于
              </Text>
              <Text style={[styles.cardDescription, settings.darkMode && styles.darkSubText]}>
                吉他调音器 v1.0.0
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={settings.darkMode ? '#666' : '#ccc'}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, settings.darkMode && styles.darkSubText]}>
          吉他调音器 v1.0.0
        </Text>
        <Text style={[styles.copyrightText, settings.darkMode && styles.darkSubText]}>
          使用自相关算法进行音高检测
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
    backgroundColor: '#1a202c',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  darkHeader: {
    backgroundColor: '#2d3748',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#a0aec0',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  darkSectionTitle: {
    color: '#718096',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  darkCard: {
    backgroundColor: '#2d3748',
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  valueBadge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3498db',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  darkValueBadge: {
    backgroundColor: '#1a365d',
    color: '#63b3ed',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sliderMin: {
    fontSize: 12,
    color: '#bbb',
    width: 30,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderMax: {
    fontSize: 12,
    color: '#bbb',
    width: 40,
    textAlign: 'right',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
});

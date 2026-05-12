import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@guitar_tuner_settings';

interface Settings {
  darkMode: boolean;
  referencePitch: number;  // A4 参考音 (415-460 Hz)
  autoGain: boolean;
  lastBpm?: number;       // 上次使用的 BPM
  lastTimeSignature?: { numerator: number; denominator: number };
}

const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  referencePitch: 440,
  autoGain: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setIsLoaded(true);
    }
  };
  
  // 保存设置
  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };
  
  // 更新单个设置
  const updateSetting = useCallback(<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  }, [settings]);
  
  return {
    settings,
    isLoaded,
    updateSetting,
    setDarkMode: (value: boolean) => updateSetting('darkMode', value),
    setReferencePitch: (value: number) => updateSetting('referencePitch', value),
    setAutoGain: (value: boolean) => updateSetting('autoGain', value),
    setLastBpm: (value: number) => updateSetting('lastBpm', value),
    setLastTimeSignature: (value: { numerator: number; denominator: number }) => 
      updateSetting('lastTimeSignature', value),
  };
}

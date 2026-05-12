import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 存储管理器
 */

// 存储键名
export const STORAGE_KEYS = {
  REFERENCE_PITCH: '@guitar_tuner:reference_pitch',
  DARK_MODE: '@guitar_tuner:dark_mode',
  AUTO_GAIN: '@guitar_tuner:auto_gain',
  LAST_BPM: '@guitar_tuner:last_bpm',
  METRONOME_SETTINGS: '@guitar_tuner:metronome_settings',
};

/**
 * 保存设置
 */
export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

/**
 * 读取设置
 */
export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value);
    }
  } catch (error) {
    console.error('读取设置失败:', error);
  }
  return defaultValue;
}

/**
 * 删除设置
 */
export async function deleteSetting(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('删除设置失败:', error);
  }
}

/**
 * 清除所有设置
 */
export async function clearAllSettings(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('清除设置失败:', error);
  }
}

// 预定义的设置保存和加载函数

export async function saveReferencePitch(frequency: number): Promise<void> {
  await saveSetting(STORAGE_KEYS.REFERENCE_PITCH, frequency);
}

export async function loadReferencePitch(): Promise<number> {
  return await loadSetting(STORAGE_KEYS.REFERENCE_PITCH, 440);
}

export async function saveDarkMode(enabled: boolean): Promise<void> {
  await saveSetting(STORAGE_KEYS.DARK_MODE, enabled);
}

export async function loadDarkMode(): Promise<boolean> {
  return await loadSetting(STORAGE_KEYS.DARK_MODE, false);
}

export async function saveAutoGain(enabled: boolean): Promise<void> {
  await saveSetting(STORAGE_KEYS.AUTO_GAIN, enabled);
}

export async function loadAutoGain(): Promise<boolean> {
  return await loadSetting(STORAGE_KEYS.AUTO_GAIN, true);
}

export async function saveLastBpm(bpm: number): Promise<void> {
  await saveSetting(STORAGE_KEYS.LAST_BPM, bpm);
}

export async function loadLastBpm(): Promise<number> {
  return await loadSetting(STORAGE_KEYS.LAST_BPM, 120);
}

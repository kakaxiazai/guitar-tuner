import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * 音频配置工具 - 统一管理音频会话配置
 * 参考开源调音器最佳实践：
 * - Fine Tuner: 使用 PlayAndRecord + 默认扬声器输出
 * - GuitarTune: 允许录音时播放参考音
 */

// expo-av 中断模式常量（兼容不同版本）
const INTERRUPTION_MODE_DO_NOT_MIX = 1;

/**
 * 配置调音器模式的音频会话
 * 允许同时录音和播放（麦克风输入 + 扬声器输出）
 */
export async function configureTunerAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    // iOS: 允许录音和播放同时进行
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    // iOS: 使用默认扬声器（非听筒）
    staysActiveInBackground: false,
    interruptionModeIOS: INTERRUPTION_MODE_DO_NOT_MIX,
    shouldDuckAndroid: true,
    interruptionModeAndroid: INTERRUPTION_MODE_DO_NOT_MIX,
    // Android: 强制通过扬声器播放
    playThroughEarpieceAndroid: false,
  });
}

/**
 * 配置纯播放模式的音频会话（手动模式播放参考音）
 * 确保声音通过扬声器播放
 */
export async function configurePlaybackAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true, // 保持录音能力，以便切回调音器
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: INTERRUPTION_MODE_DO_NOT_MIX,
    shouldDuckAndroid: true,
    interruptionModeAndroid: INTERRUPTION_MODE_DO_NOT_MIX,
    playThroughEarpieceAndroid: false, // 确保使用扬声器
  });
}

/**
 * 确保音频路由到扬声器
 * 在播放参考音前调用
 */
export async function routeToSpeaker(): Promise<void> {
  try {
    await configurePlaybackAudioMode();
  } catch (error) {
    console.warn('设置扬声器路由失败:', error);
  }
}

/**
 * 重置音频模式到默认状态
 */
export async function resetAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    interruptionModeIOS: INTERRUPTION_MODE_DO_NOT_MIX,
    shouldDuckAndroid: false,
    interruptionModeAndroid: INTERRUPTION_MODE_DO_NOT_MIX,
    playThroughEarpieceAndroid: false,
  });
}

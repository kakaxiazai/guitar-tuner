import { Audio } from 'expo-av';
import { routeToSpeaker } from './AudioConfig';

/**
 * 音频生成器类 - 使用预生成的音频文件播放声音
 * 使用静态 require() 加载打包的音频资源（Metro bundler 兼容）
 */
export class SoundGenerator {
  private sound: Audio.Sound | null = null;
  private volume: number = 0.5;
  private soundCache: Map<string, string> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化音频缓存
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 静态 require 调用（Metro bundler 需要）
      const sounds: [string, number][] = [
        ['string_E2', require('../../assets/audio/string_E2.wav')],
        ['string_A2', require('../../assets/audio/string_A2.wav')],
        ['string_D3', require('../../assets/audio/string_D3.wav')],
        ['string_G3', require('../../assets/audio/string_G3.wav')],
        ['string_B3', require('../../assets/audio/string_B3.wav')],
        ['string_E4', require('../../assets/audio/string_E4.wav')],
        ['metronome_accent', require('../../assets/audio/metronome_accent.wav')],
        ['metronome_beat', require('../../assets/audio/metronome_beat.wav')],
        ['metronome_sub', require('../../assets/audio/metronome_sub.wav')],
      ];

      for (const [key, asset] of sounds) {
        try {
          const uri = await this.resolveAsset(asset);
          if (uri) {
            this.soundCache.set(key, uri);
          }
        } catch (e) {
          console.warn(`Failed to load sound: ${key}`, e);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('SoundGenerator init failed:', error);
    }
  }

  /**
   * 解析单个资源的 URI
   */
  private async resolveAsset(asset: any): Promise<string | null> {
    // 尝试使用 expo-asset
    try {
      const expoAsset = require('expo-asset');
      if (expoAsset && expoAsset.Asset) {
        const assetObj = expoAsset.Asset.fromModule(asset);
        await assetObj.downloadAsync();
        const uri = assetObj.localUri || assetObj.uri;
        if (uri) return uri;
      }
    } catch (e) {
      // expo-asset 不可用
    }

    // 如果资源本身是 URI 字符串
    if (typeof asset === 'string') {
      return asset;
    }

    // 如果是模块对象，尝试获取 default export
    if (asset && typeof asset === 'object' && asset.default) {
      return asset.default;
    }

    return null;
  }

  /**
   * 播放音频
   */
  async playSound(soundName: string): Promise<void> {
    try {
      await routeToSpeaker();
      await this.initialize();

      const soundUri = this.soundCache.get(soundName);
      if (!soundUri) {
        console.warn(`Sound not found: ${soundName}`);
        return;
      }

      await this.stop();

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: true, volume: this.volume }
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.cleanup();
        }
      });
    } catch (error) {
      console.error(`播放声音失败 [${soundName}]:`, error);
    }
  }

  /**
   * 播放节拍声音
   */
  async playMetronomeClick(isAccent: boolean = false, isSubdivision: boolean = false): Promise<void> {
    if (isSubdivision) {
      await this.playSound('metronome_sub');
    } else if (isAccent) {
      await this.playSound('metronome_accent');
    } else {
      await this.playSound('metronome_beat');
    }
  }

  /**
   * 播放吉他参考音
   */
  async playGuitarString(stringNumber: number): Promise<void> {
    const soundMap: Record<number, string> = {
      6: 'string_E2',
      5: 'string_A2',
      4: 'string_D3',
      3: 'string_G3',
      2: 'string_B3',
      1: 'string_E4',
    };

    const soundName = soundMap[stringNumber];
    if (!soundName) {
      throw new Error(`无效的琴弦编号: ${stringNumber}`);
    }

    await this.playSound(soundName);
  }

  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        // 忽略
      }
      this.sound = null;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        // 忽略
      }
      this.sound = null;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isCurrentlyPlaying(): boolean {
    return this.sound !== null;
  }

  async release(): Promise<void> {
    await this.stop();
    this.soundCache.clear();
    this.isInitialized = false;
  }
}

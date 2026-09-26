import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TunerScreen from './src/screens/TunerScreen';
import MetronomeScreen from './src/screens/MetronomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TunerSelfTestRunner from './src/dev/TunerSelfTestRunner';

const Tab = createBottomTabNavigator();

/**
 * 自检深链：guitartuner://selftest
 *
 * 用途：让调音核心链路能在云端的真实设备上被自动断言（麦克风是唯一无法云端验证的环节）。
 *   adb shell am start -a android.intent.action.VIEW -d "guitartuner://selftest"
 */
const SELF_TEST_URL_MARKER = 'selftest';

function isSelfTestUrl(url: string | null | undefined): boolean {
  return !!url && url.toLowerCase().includes(SELF_TEST_URL_MARKER);
}

export default function App() {
  const [selfTestMode, setSelfTestMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 冷启动：应用由深链拉起
    Linking.getInitialURL()
      .then((url) => {
        if (mounted && isSelfTestUrl(url)) {
          setSelfTestMode(true);
        }
      })
      .catch(() => {
        // 取不到初始 URL 不影响正常使用
      });

    // 热启动：应用已在前台/后台时收到深链
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isSelfTestUrl(url)) {
        setSelfTestMode(true);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (selfTestMode) {
    return <TunerSelfTestRunner />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Tuner') {
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
            } else if (route.name === 'Metronome') {
              iconName = focused ? 'time' : 'time-outline';
            } else {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Tuner" component={TunerScreen} options={{ title: '调音器' }} />
        <Tab.Screen name="Metronome" component={MetronomeScreen} options={{ title: '节拍器' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

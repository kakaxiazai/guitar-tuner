import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TunerScreen from './screens/TunerScreen';
import MetronomeScreen from './screens/MetronomeScreen';
import SettingsScreen from './screens/SettingsScreen';

// 定义 Tab Navigator
type RootTabsParamList = {
  Tuner: undefined;
  Metronome: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const iconNameMap: Record<string, string> = {
            Tuner: 'musical-notes-outline',
            Metronome: 'time-outline',
            Settings: 'settings-outline',
          };

          const iconName = iconNameMap[route.name] || 'musical-notes-outline';

          return {
            tabBarIcon: ({ focused, color, size }) => {
              const iconMap: Record<string, string> = {
                Tuner: 'musical-notes',
                Metronome: 'time',
                Settings: 'settings',
              };

              const iconName = iconMap[route.name] || 'musical-notes';
              // 使用类型断言来绕过类型检查
              return <Ionicons name={iconName as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3498db',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: 'white',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            headerStyle: {
              backgroundColor: '#3498db',
            },
            headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          };
        }}
      >
        <Tab.Screen
          name="Tuner"
          component={TunerScreen}
          options={{
            title: '调音器',
          }}
        />
        <Tab.Screen
          name="Metronome"
          component={MetronomeScreen}
          options={{
            title: '节拍器',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: '设置',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

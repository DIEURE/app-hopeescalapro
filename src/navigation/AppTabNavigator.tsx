import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Music,
  Home,
  Menu,
} from 'lucide-react-native';
import * as NavigationBar from 'expo-navigation-bar';

import HomeScreen from '../screens/home/HomeScreen';
import MinhasEscalasScreen from '../screens/escalas/MinhasEscalasScreen';
import RepertorioScreen from '../screens/repertorio/RepertorioScreen';
import MaisScreen from '../screens/mais/MaisScreen';

const Tab = createBottomTabNavigator();
const AZUL_CLARO = '#38BDF8';

export default function AppTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync(AZUL_CLARO);
        NavigationBar.setButtonStyleAsync('dark');
      } catch (error) {}
    }
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#033c60',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Escalas"
        component={MinhasEscalasScreen}
        options={{
          tabBarLabel: 'Escalas',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Repertorio"
        component={RepertorioScreen}
        options={{
          tabBarLabel: 'Repertório',
          tabBarIcon: ({ color, size }) => <Music color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Mais"
        component={MaisScreen}
        options={{
          tabBarLabel: 'Mais',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
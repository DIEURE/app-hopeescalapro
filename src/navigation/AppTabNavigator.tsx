import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, Music, User } from 'lucide-react-native';
import MinhasEscalasScreen from '../screens/escalas/MinhasEscalasScreen';
import RepertorioScreen from '../screens/repertorio/RepertorioScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';
import { colors } from '../config/theme';

const Tab = createBottomTabNavigator();

export default function AppTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Escalas"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0b1120',
          borderTopColor: colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
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
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
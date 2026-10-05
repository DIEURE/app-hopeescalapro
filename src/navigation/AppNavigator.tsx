import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AppTabNavigator from './AppTabNavigator';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { usuario, token } = useAuth();
  const autenticado = Boolean(usuario && token);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!autenticado ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={AppTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
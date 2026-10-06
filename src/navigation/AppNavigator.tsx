import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import AppTabNavigator from './AppTabNavigator';
import DisponibilidadeScreen from '../screens/disponibilidade/DisponibilidadeScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';
import SalaEnsaioScreen from '../screens/salas/SalaEnsaioScreen';
import AtasVotacoesScreen from '../screens/atas/AtasVotacoesScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { usuario } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!usuario ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {/* Abas principais */}
          <Stack.Screen name="MainTabs" component={AppTabNavigator} />

          {/* Telas abertas a partir do "Mais" (cobrem as abas e têm voltar) */}
          <Stack.Screen name="Disponibilidade" component={DisponibilidadeScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="SalaEnsaio" component={SalaEnsaioScreen} />
          <Stack.Screen name="AtasVotacoes" component={AtasVotacoesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
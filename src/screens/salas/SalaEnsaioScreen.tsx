import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Music2 } from 'lucide-react-native';
import { colors } from '../../config/theme';

export default function SalaEnsaioScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Music2 size={44} color={colors.primary} />
        <Text style={styles.title}>Salas de Estudo</Text>
        <Text style={styles.subtitle}>Tela Disponivel.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
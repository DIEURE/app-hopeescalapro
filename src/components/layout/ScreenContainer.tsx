import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../../config/theme';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
}

export default function ScreenContainer({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background || '#020617'}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#020617',
  },
});
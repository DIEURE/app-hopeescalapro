import React from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';

export default function LoginSplash() {
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#F9FAFB"
        barStyle="dark-content"
      />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          HOPE <Text style={styles.titleHighlight}>ESCALA PRO</Text>
        </Text>

        <Text style={styles.subtitle}>
          Preparando seu ambiente...
        </Text>

        <ActivityIndicator
          size="large"
          color="#FF6B00"
          style={styles.loader}
        />

        <Text style={styles.footer}>
          LOUVOR & ADORAÇÃO
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleHighlight: {
    color: '#FF6B00',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  loader: {
    marginTop: 28,
  },
  footer: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 24,
  },
});

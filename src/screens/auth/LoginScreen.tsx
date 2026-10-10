import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoginSplash from '../../components/LoginSplash';

const { width, height } = Dimensions.get('window');

// SVG COM CONTRASTE VISÍVEL E VETORES BEM DEFINIDOS
function BackgroundSvg() {
  return (
    <View style={styles.svgBackgroundWrapper} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {/* Gradiente da onda superior */}
          <LinearGradient id="waveGradTop" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF6B00" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#FFA05C" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FFF2E8" stopOpacity="0.05" />
          </LinearGradient>

          {/* Gradiente da onda inferior */}
          <LinearGradient id="waveGradBottom" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FF6B00" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#FFF5EB" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Onda decorativa superior marcante */}
        <Path
          d={`M 0 0 L ${width} 0 L ${width} ${height * 0.32} Q ${width * 0.45} ${height * 0.40} 0 ${height * 0.22} Z`}
          fill="url(#waveGradTop)"
        />

        {/* Círculo de profundidade lateral */}
        <Circle
          cx={width * 0.9}
          cy={height * 0.16}
          r={width * 0.32}
          fill="#FF6B00"
          opacity={0.18}
        />

        {/* Círculo sutil no lado esquerdo */}
        <Circle
          cx={width * 0.05}
          cy={height * 0.52}
          r={width * 0.22}
          fill="#FF8A34"
          opacity={0.12}
        />

        {/* Onda decorativa na base da tela */}
        <Path
          d={`M 0 ${height} L ${width} ${height} L ${width} ${height * 0.8} Q ${width * 0.55} ${height * 0.72} 0 ${height * 0.88} Z`}
          fill="url(#waveGradBottom)"
        />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      setErroMsg('Preencha seu e-mail e sua senha.');
      return;
    }

    try {
      setCarregando(true);
      setErroMsg('');

      const [response] = await Promise.all([
        api.post('/auth/login', {
          email: email.trim(),
          senha: senha.trim(),
        }),
        new Promise<void>((resolve) => {
          setTimeout(resolve, 2500);
        }),
      ]);

      const {
        token,
        nome,
        email: userEmail,
        perfil,
        empresaId,
        nomeEmpresa,
      } = response.data;

      await login(token, {
        nome,
        email: userEmail,
        perfil,
        empresaId,
        nomeEmpresa,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        'Não foi possível autenticar. Verifique seus dados.';

      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return <LoginSplash />;
  }

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* SVG NO FUNDO */}
      <BackgroundSvg />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* LOGO */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brandTitle}>
              HOPE <Text style={styles.brandTitleHighlight}>ESCALA PRO</Text>
            </Text>
            <Text style={styles.brandSubtitle}>
              Acesse sua conta para ver suas escalas
            </Text>

            {erroMsg ? <Text style={styles.errorText}>{erroMsg}</Text> : null}

            {/* CAMPO E-MAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* CAMPO SENHA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {mostrarSenha ? (
                    <EyeOff size={18} color="#6B7280" />
                  ) : (
                    <Eye size={18} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* BOTÃO ENTRAR */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#efefee',
    position: 'relative',
  },
  svgBackgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#557d7f',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: '#557d7f',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 1.2,
  },
  brandTitleHighlight: {
    color: '#FF6B00',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    width: '100%',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    width: '100%',
  },
  input: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#ff5500',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

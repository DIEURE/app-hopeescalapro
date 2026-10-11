import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Phone,
  Lock,
  Home,
  Shield,
  Save,
  LogOut,
  Check,
  AlertTriangle,
} from 'lucide-react-native';

import {api }from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [formulario, setFormulario] = useState({
    nome: '',
    email: '',
    telefone: '',
    perfil: '',
    empresaNome: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        setLoading(true);
        const res = await api.get('/usuarios/meu-perfil');
        const dados = res?.data || {};

        if (ativo) {
          setFormulario((prev) => ({
            ...prev,
            nome: dados.nome || usuario?.nome || '',
            email: dados.email || usuario?.email || '',
            telefone: dados.telefone || usuario?.telefone || '',
            perfil: dados.perfil || usuario?.perfil || usuario?.role || 'Voluntário',
            empresaNome: dados.empresaNome || usuario?.empresaNome || 'Hope Church',
          }));
        }
      } catch (err) {
        if (ativo && usuario) {
          setFormulario((prev) => ({
            ...prev,
            nome: usuario.nome || '',
            email: usuario.email || '',
            telefone: usuario.telefone || '',
            perfil: usuario.perfil || usuario.role || 'Voluntário',
            empresaNome: usuario.empresaNome || 'Hope Church',
          }));
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [usuario?.id, usuario?.email]);

  const handleChange = (campo: string, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async () => {
    setFeedback(null);

    if (!formulario.nome.trim()) {
      setFeedback({ tipo: 'erro', texto: 'O nome completo é obrigatório.' });
      return;
    }

    if (formulario.novaSenha) {
      if (formulario.novaSenha.length < 6) {
        setFeedback({ tipo: 'erro', texto: 'A nova senha precisa ter no mínimo 6 caracteres.' });
        return;
      }
      if (formulario.novaSenha !== formulario.confirmarNovaSenha) {
        setFeedback({ tipo: 'erro', texto: 'A confirmação da nova senha não confere.' });
        return;
      }
      if (!formulario.senhaAtual) {
        setFeedback({ tipo: 'erro', texto: 'Informe a senha atual para confirmar a alteração.' });
        return;
      }
    }

    try {
      setSalvando(true);
      const payload = {
        nome: formulario.nome.trim(),
        telefone: formulario.telefone.trim(),
        senhaAtual: formulario.senhaAtual || null,
        novaSenha: formulario.novaSenha || null,
      };

      await api.put('/usuarios/meu-perfil', payload);

      setFeedback({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' });
      setFormulario((prev) => ({
        ...prev,
        senhaAtual: '',
        novaSenha: '',
        confirmarNovaSenha: '',
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao salvar alterações no perfil.';
      setFeedback({ tipo: 'erro', texto: msg });
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarLogout = () => {
    Alert.alert('Encerrar Sessão', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>CONTA & PREFERÊNCIAS</Text>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={handleConfirmarLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* FEEDBACK DE SUCESSO OU ERRO */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.tipo === 'sucesso' ? styles.feedbackSucesso : styles.feedbackErro,
              ]}
            >
              {feedback.tipo === 'sucesso' ? (
                <Check size={18} color="#15803D" />
              ) : (
                <AlertTriangle size={18} color="#B91C1C" />
              )}
              <Text
                style={[
                  styles.feedbackTexto,
                  feedback.tipo === 'sucesso'
                    ? styles.feedbackTextoSucesso
                    : styles.feedbackTextoErro,
                ]}
              >
                {feedback.texto}
              </Text>
            </View>
          )}

          {/* BLOCO 1: DADOS PESSOAIS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <User size={18} color="#FF6B00" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.cardTitle}>Informações Pessoais</Text>
                <Text style={styles.cardDesc}>
                  Dados cadastrais visíveis para os líderes na escala
                </Text>
              </View>
            </View>

            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME COMPLETO *</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formulario.nome}
                  onChangeText={(v) => handleChange('nome', v)}
                  placeholder="Seu nome"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formulario.telefone}
                  onChangeText={(v) => handleChange('telefone', v)}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* E-mail (Leitura) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-MAIL (LOGIN)</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={formulario.email}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <Text style={styles.helperText}>
                O e-mail de acesso é gerenciado pela liderança.
              </Text>
            </View>

            {/* Perfil & Congregação */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PERFIL & CONGREGAÇÃO</Text>
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Shield size={14} color="#FF6B00" />
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {formulario.perfil || 'VOLUNTÁRIO'}
                  </Text>
                </View>

                <View style={styles.badge}>
                  <Home size={14} color="#FF6B00" />
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {formulario.empresaNome || 'Hope Church'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* BLOCO 2: SEGURANÇA */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Lock size={18} color="#059669" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.cardTitle}>Segurança de Acesso</Text>
                <Text style={styles.cardDesc}>
                  Preencha apenas se desejar trocar sua senha atual
                </Text>
              </View>
            </View>

            {/* Senha Atual */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SENHA ATUAL</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={formulario.senhaAtual}
                  onChangeText={(v) => handleChange('senhaAtual', v)}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOVA SENHA</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={formulario.novaSenha}
                  onChangeText={(v) => handleChange('novaSenha', v)}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Confirmar Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRMAR NOVA SENHA</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={formulario.confirmarNovaSenha}
                  onChangeText={(v) => handleChange('confirmarNovaSenha', v)}
                  placeholder="Repita a nova senha"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* BOTÃO SALVAR */}
          <TouchableOpacity
            style={[styles.btnSalvar, salvando && styles.btnSalvarDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {salvando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.btnSalvarTexto}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  btnLogout: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackSucesso: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  feedbackErro: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackTexto: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  feedbackTextoSucesso: {
    color: '#15803D',
  },
  feedbackTextoErro: {
    color: '#B91C1C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTexts: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  inputTextDisabled: {
    color: '#6B7280',
  },
  helperText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    marginLeft: 6,
    flexShrink: 1,
  },
  btnSalvar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    height: 50,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSalvarDisabled: {
    opacity: 0.6,
  },
  btnSalvarTexto: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
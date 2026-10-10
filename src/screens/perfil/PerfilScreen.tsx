import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LogOut,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Music,
  ChevronRight,
  Info,
  HelpCircle,
  KeyRound,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../config/theme';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  const handleConfirmarLogout = () => {
    Alert.alert(
      'Encerrar Sessão',
      'Tem certeza de que deseja sair da sua conta no Hope Escala Pro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getIniciais = (nome?: string) => {
    if (!nome) return 'HP';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER FIXO */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarSub}>CONTA & PREFERÊNCIAS</Text>
          <Text style={styles.topBarTitulo}>Meu Perfil</Text>
        </View>

        <TouchableOpacity
          style={styles.btnLogoutTopo}
          onPress={handleConfirmarLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD PRINCIPAL DO USUÁRIO */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIniciais}>
              {getIniciais(usuario?.nome)}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.nomeText} numberOfLines={1}>
              {usuario?.nome || 'Voluntário Hope'}
            </Text>

            <View style={styles.roleBadge}>
              <ShieldCheck size={13} color="#FF6B00" />
              <Text style={styles.roleText}>
                {usuario?.role || 'Membro da Equipe'}
              </Text>
            </View>
          </View>
        </View>

        {/* DADOS DE CONTATO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>DADOS PESSOAIS</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Mail size={16} color="#6B7280" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {usuario?.email || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Phone size={16} color="#6B7280" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Telefone / WhatsApp</Text>
              <Text style={styles.infoValue}>
                {usuario?.telefone || '(Não cadastrado)'}
              </Text>
            </View>
          </View>
        </View>

        {/* VÍNCULO MINISTERIAL */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>MINISTÉRIO & ATUAÇÃO</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Building2 size={16} color="#6B7280" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Congregação / Igreja</Text>
              <Text style={styles.infoValue}>
                {usuario?.congregacao || usuario?.igreja || 'Sede Principal'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Music size={16} color="#6B7280" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Instrumentos / Função</Text>
              <Text style={styles.infoValue}>
                {usuario?.instrumento || usuario?.funcao || 'Música & Louvor'}
              </Text>
            </View>
          </View>
        </View>

        {/* ATALHOS E AJUDA */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CONFIGURAÇÕES DO APP</Text>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Redefinir Senha',
                'Para alterar sua senha de acesso, utilize a recuperação de senha na tela de login ou fale com o administrador da sua escala.'
              )
            }
          >
            <View style={styles.iconWrapper}>
              <KeyRound size={16} color="#6B7280" />
            </View>
            <Text style={styles.menuLabel}>Segurança & Senha</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Suporte Hope Escala Pro',
                'Dúvidas ou problemas com sua escala? Entre em contato com a liderança da sua congregação.'
              )
            }
          >
            <View style={styles.iconWrapper}>
              <HelpCircle size={16} color="#6B7280" />
            </View>
            <Text style={styles.menuLabel}>Central de Ajuda</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* BOTÃO DE SAÍDA LARGO */}
        <TouchableOpacity
          style={styles.btnSairCard}
          activeOpacity={0.8}
          onPress={handleConfirmarLogout}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.btnSairTexto}>Encerrar Sessão</Text>
        </TouchableOpacity>

        {/* RODAPÉ INFORMATIVO */}
        <View style={styles.footer}>
          <Text style={styles.footerApp}>Hope Escala Pro • v1.0.0</Text>
          <Text style={styles.footerDesc}>
            Gestão inteligente de escalas e repertório
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topBarSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  topBarTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 1,
  },
  btnLogoutTopo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIniciais: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6B00',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  btnSairCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  btnSairTexto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 3,
  },
  footerApp: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  footerDesc: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D1D5DB',
  },
});
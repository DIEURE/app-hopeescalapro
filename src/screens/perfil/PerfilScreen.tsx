import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LogOut, User, Mail, Phone, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../config/theme';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={34} color={colors.primary} strokeWidth={2.2} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.nomeText}>{usuario?.nome || 'Voluntário'}</Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={13} color={colors.primary} />
            <Text style={styles.roleText}>{usuario?.role || 'Músico'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>DADOS DA CONTA</Text>

        <View style={styles.infoRow}>
          <View style={styles.iconWrapper}>
            <Mail size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>E-mail</Text>
            <Text style={styles.infoValue}>{usuario?.email || '-'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconWrapper}>
            <Phone size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Telefone / WhatsApp</Text>
            <Text style={styles.infoValue}>{usuario?.telefone || '(Não cadastrado)'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
  },
});
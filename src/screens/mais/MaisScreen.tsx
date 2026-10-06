import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  CalendarCheck,
  User,
  Users,
  Vote,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { colors } from '../../config/theme';
import { navigate } from '../../navigation/navigationRef';

interface ModuloItem {
  id: string;
  titulo: string;
  descricao: string;
  rota: string;
  icone: React.ComponentType<{ size: number; color: string }>;
  cor: string;
}

const MODULOS: ModuloItem[] = [
  {
    id: 'disponibilidade',
    titulo: 'Disponibilidade',
    descricao: 'Informe os domingos e cultos em que você pode servir',
    rota: 'Disponibilidade',
    icone: CalendarCheck,
    cor: '#34D399',
  },
  {
    id: 'perfil',
    titulo: 'Meu Perfil',
    descricao: 'Dados cadastrais, instrumentos e preferências',
    rota: 'Perfil',
    icone: User,
    cor: '#F472B6',
  },
  {
    id: 'sala-ensaio',
    titulo: 'Sala de Ensaio',
    descricao: 'Metrônomo, cronômetro e dinâmica dos ensaios',
    rota: 'SalaEnsaio',
    icone: Users,
    cor: '#38BDF8',
  },
  {
    id: 'atas-votacoes',
    titulo: 'Atas e Votações',
    descricao: 'Decisões da equipe, assembleias e enquetes',
    rota: 'AtasVotacoes',
    icone: Vote,
    cor: '#A78BFA',
  },
];

export default function MaisScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Mais Módulos</Text>
          <Text style={styles.headerSubtitle}>Ferramentas e recursos do Hope Escala</Text>
        </View>
        <View style={styles.badge}>
          <Sparkles size={14} color="#38BDF8" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lista}>
          {MODULOS.map((item) => {
            const Icone = item.icone;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigate(item.rota)}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.cor}1F` }]}>
                  <Icone size={22} color={item.cor} />
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Text style={styles.cardDescricao} numberOfLines={2}>
                    {item.descricao}
                  </Text>
                </View>

                <ChevronRight size={20} color="#64748B" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary || '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary || '#94A3B8',
    marginTop: 2,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  lista: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoBox: {
    flex: 1,
    marginRight: 8,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  cardDescricao: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
});
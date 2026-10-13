import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  User,
  Users,
  Vote,
  ChevronRight,
  Sparkles,
  LucideIcon,
} from 'lucide-react-native';
import { navigate } from '../../navigation/navigationRef';

interface ModuloItem {
  id: string;
  titulo: string;
  descricao: string;
  rota: string;
  icone: LucideIcon;
  corIcone: string;
  bgIcone: string;
}

const MODULOS: ModuloItem[] = [
  {
    id: 'escalamensal',
    titulo: 'Escala Mensal',
    descricao: 'Visão geral e planejamento mensal das escalas',
    rota: 'EscalaMensal',
    icone: CalendarCheck,
    corIcone: '#4506D9',
    bgIcone: '#EEF2FF',
  },
 /*  {
    id: 'disponibilidade',
    titulo: 'Disponibilidade',
    descricao: 'Informe os cultos e datas em que você pode servir',
    rota: 'Disponibilidade',
    icone: CalendarCheck,
    corIcone: '#D97706',
    bgIcone: '#FFFBEB',
  }, */
  /* {
    id: 'perfil',
    titulo: 'Meu Perfil',
    descricao: 'Dados cadastrais, instrumentos e preferências',
    rota: 'Perfil',
    icone: User,
    corIcone: '#2563EB',
    bgIcone: '#EFF6FF',
  },
  {
    id: 'sala-ensaio',
    titulo: 'Sala de Ensaio',
    descricao: 'Metrônomo, cronômetro e dinâmica dos ensaios',
    rota: 'SalaEnsaio',
    icone: Users,
    corIcone: '#9333EA',
    bgIcone: '#FAF5FF',
  }, */
  {
    id: 'atas-votacoes',
    titulo: 'Atas e Votações',
    descricao: 'Decisões da equipe, assembleias e enquetes',
    rota: 'AtasVotacoes',
    icone: Vote,
    corIcone: '#E11D48',
    bgIcone: '#FFF1F2',
  },
];

export default function MaisScreen() {
  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#e6e5e5" />

      {/* HEADER COMPACTO NO PADRÃO DO APP */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.subTitulo}>Hope Escala Pro</Text>
          <Text style={styles.headerTitle}>Mais Recursos</Text>
        </View>
        <View style={styles.badge}>
          <Sparkles size={16} color="#FF6B00" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.secaoTitulo}>Módulos Disponíveis</Text>

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
                <View style={[styles.iconBox, { backgroundColor: item.bgIcone }]}>
                  <Icone size={20} color={item.corIcone} />
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Text style={styles.cardDescricao} numberOfLines={2}>
                    {item.descricao}
                  </Text>
                </View>

                <ChevronRight size={18} color="#668abd" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#e3e7fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleBox: {
    flex: 1,
  },
  subTitulo: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 0,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  content: {
    padding: 14,
    paddingBottom: 28,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  lista: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBox: {
    flex: 1,
    marginRight: 8,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardDescricao: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
});

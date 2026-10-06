import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  CalendarDays,
  Music,
  Users,
  CalendarCheck,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { colors } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { navigate } from '../../navigation/navigationRef';
import api from '../../services/api';

interface ProximaEscala {
  id: number;
  data: string;
  horario: string;
  funcao: string;
  evento: string;
  local?: string;
  confirmado: boolean;
}

export default function HomeScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proximaEscala, setProximaEscala] = useState<ProximaEscala | null>(null);

  const carregarDadosHome = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await api.get('/escala-musicos/minhas-escalas');
      const escalas = response.data;

      if (Array.isArray(escalas) && escalas.length > 0) {
        // Pega a primeira escala futura retornada
        const prox = escalas[0];
        setProximaEscala({
          id: prox.id || 1,
          data: prox.data || 'Próximo Domingo',
          horario: prox.horario || '19:00',
          funcao: prox.funcao || prox.instrumento || 'Músico',
          evento: prox.culto || prox.evento || 'Culto de Celebração',
          local: prox.local || 'Templo Principal',
          confirmado: !!prox.confirmado,
        });
      } else {
        setProximaEscala(null);
      }
    } catch (error) {
      // Caso a rota falhe ou retorne vazio em dev, mantém estado controlado
      setProximaEscala(null);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosHome();
  }, [carregarDadosHome]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDadosHome();
  };

  const primeiroNome = usuario?.nome ? usuario.nome.split(' ')[0] : 'Músico';

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary || '#38BDF8'}
            colors={[colors.primary || '#38BDF8']}
          />
        }
      >
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>Olá, {primeiroNome} 👋</Text>
            <Text style={styles.subSaudacao}>Hope Escala Pro</Text>
          </View>

          <TouchableOpacity
            style={styles.notificacaoBtn}
            activeOpacity={0.7}
            onPress={() => navigate('AtasVotacoes')}
          >
            <Bell size={20} color="#F8FAFC" />
            <View style={styles.notificacaoPonto} />
          </TouchableOpacity>
        </View>

        {/* CARD DESTAQUE: PRÓXIMA ESCALA */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>Sua Próxima Escala</Text>
            <TouchableOpacity onPress={() => navigate('Escalas')}>
              <Text style={styles.secaoLink}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {carregando && !refreshing ? (
            <View style={styles.cardLoading}>
              <ActivityIndicator color={colors.primary || '#38BDF8'} />
            </View>
          ) : proximaEscala ? (
            <View style={styles.cardDestaque}>
              <View style={styles.cardDestaqueTopo}>
                <View style={styles.tagEvento}>
                  <Sparkles size={12} color="#38BDF8" />
                  <Text style={styles.tagEventoTexto}>{proximaEscala.evento}</Text>
                </View>

                {proximaEscala.confirmado ? (
                  <View style={styles.statusConfirmado}>
                    <CheckCircle2 size={12} color="#34D399" />
                    <Text style={styles.statusConfirmadoTexto}>Confirmado</Text>
                  </View>
                ) : (
                  <View style={styles.statusPendente}>
                    <Text style={styles.statusPendenteTexto}>Pendente</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardFuncao}>{proximaEscala.funcao}</Text>

              <View style={styles.cardInfos}>
                <View style={styles.cardInfoItem}>
                  <Clock size={14} color="#94A3B8" />
                  <Text style={styles.cardInfoTexto}>
                    {proximaEscala.data} às {proximaEscala.horario}
                  </Text>
                </View>

                {proximaEscala.local && (
                  <View style={styles.cardInfoItem}>
                    <MapPin size={14} color="#94A3B8" />
                    <Text style={styles.cardInfoTexto}>{proximaEscala.local}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.botaoAcaoCard}
                activeOpacity={0.8}
                onPress={() => navigate('SalaEnsaio')}
              >
                <Users size={16} color="#020617" />
                <Text style={styles.botaoAcaoTexto}>Abrir Sala de Ensaio</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardVazio}>
              <CalendarDays size={32} color="#475569" />
              <Text style={styles.cardVazioTitulo}>Nenhuma escala próxima</Text>
              <Text style={styles.cardVazioDescricao}>
                Você não está escalado para os próximos dias ou sua escala ainda não foi gerada.
              </Text>
            </View>
          )}
        </View>

        {/* ATALHOS RÁPIDOS */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Acesso Rápido</Text>
          <View style={styles.gridAtalhos}>
            <TouchableOpacity
              style={styles.cardAtalho}
              activeOpacity={0.7}
              onPress={() => navigate('Escalas')}
            >
              <View style={[styles.atalhoIcone, { backgroundColor: '#38BDF81A' }]}>
                <CalendarDays size={22} color="#38BDF8" />
              </View>
              <Text style={styles.atalhoTitulo}>Escalas</Text>
              <Text style={styles.atalhoDescricao}>Minhas escalas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardAtalho}
              activeOpacity={0.7}
              onPress={() => navigate('Repertorio')}
            >
              <View style={[styles.atalhoIcone, { backgroundColor: '#A78BFA1A' }]}>
                <Music size={22} color="#A78BFA" />
              </View>
              <Text style={styles.atalhoTitulo}>Repertório</Text>
              <Text style={styles.atalhoDescricao}>Músicas e tons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardAtalho}
              activeOpacity={0.7}
              onPress={() => navigate('Disponibilidade')}
            >
              <View style={[styles.atalhoIcone, { backgroundColor: '#34D3991A' }]}>
                <CalendarCheck size={22} color="#34D399" />
              </View>
              <Text style={styles.atalhoTitulo}>Disponibilidade</Text>
              <Text style={styles.atalhoDescricao}>Datas livres</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardAtalho}
              activeOpacity={0.7}
              onPress={() => navigate('SalaEnsaio')}
            >
              <View style={[styles.atalhoIcone, { backgroundColor: '#F472B61A' }]}>
                <Users size={22} color="#F472B6" />
              </View>
              <Text style={styles.atalhoTitulo}>Ensaio</Text>
              <Text style={styles.atalhoDescricao}>Metrônomo e ordem</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AVISOS / ATIVIDADES */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Mural da Equipe</Text>
          <TouchableOpacity
            style={styles.cardAviso}
            activeOpacity={0.7}
            onPress={() => navigate('AtasVotacoes')}
          >
            <View style={styles.avisoConteudo}>
              <Text style={styles.avisoTitulo}>Votações e Avisos Gerais</Text>
              <Text style={styles.avisoTexto}>
                Acompanhe as decisões de repertório, escalas especiais e comunicados ministeriais.
              </Text>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  saudacao: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subSaudacao: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  notificacaoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificacaoPonto: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  secao: {
    marginBottom: 24,
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  secaoLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38BDF8',
  },
  cardLoading: {
    height: 140,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardDestaque: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardDestaqueTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagEvento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF815',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagEventoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  statusConfirmado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#34D39915',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  statusPendente: {
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPendenteTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  cardFuncao: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  cardInfos: {
    gap: 6,
    marginBottom: 16,
  },
  cardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfoTexto: {
    fontSize: 13,
    color: '#94A3B8',
  },
  botaoAcaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
  },
  botaoAcaoTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#020617',
  },
  cardVazio: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  cardVazioTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  cardVazioDescricao: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  gridAtalhos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  cardAtalho: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  atalhoIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  atalhoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  atalhoDescricao: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avisoConteudo: {
    flex: 1,
    marginRight: 10,
  },
  avisoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  avisoTexto: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Calendar,
  Clock,
  Music,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Headphones,
  User,
  Sun,
  Moon,
  CheckCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';

export type StatusPresenca = 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE';

export interface MinhaEscalaItemDTO {
  id: number;
  escalaId: number;
  dataEscala: string; // YYYY-MM-DD
  diaSemana?: string;
  tipoCulto: 'MANHA' | 'NOITE' | string;
  nomeCulto?: string | null;
  horario?: string | null;
  instrumentoOuFuncao?: string | null;
  ministro?: string | null;
  status: StatusPresenca;
  observacao?: string | null;
}

export default function MinhasEscalasScreen() {
  const navigation = useNavigation<any>();

  const [escalas, setEscalas] = useState<MinhaEscalaItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const isDataPassada = (dataStr: string): boolean => {
    if (!dataStr) return false;
    const partes = dataStr.substring(0, 10).split('-').map(Number);
    if (partes.length < 3) return false;
    const [ano, mes, dia] = partes;
    const dataEscala = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataEscala.getTime() < hoje.getTime();
  };

  const carregarEscalas = useCallback(async () => {
    try {
      setErro(null);
      const res = await api.get<any[]>('/escala-musicos/minhas-escalas');
      const dados = Array.isArray(res.data) ? res.data : [];

      const formatados: MinhaEscalaItemDTO[] = dados.map((item: any, idx: number) => {
        let statusNormalizado: StatusPresenca = 'PENDENTE';
        if (item.confirmado === true || item.status === 'CONFIRMADO') {
          statusNormalizado = 'CONFIRMADO';
        } else if (item.confirmado === false || item.status === 'RECUSADO') {
          statusNormalizado = 'RECUSADO';
        }

        let dataResolvida = '';
        if (typeof item.dataEscala === 'string') {
          dataResolvida = item.dataEscala.substring(0, 10);
        } else if (Array.isArray(item.dataEscala) && item.dataEscala.length >= 3) {
          const ano = item.dataEscala[0];
          const mes = String(item.dataEscala[1]).padStart(2, '0');
          const dia = String(item.dataEscala[2]).padStart(2, '0');
          dataResolvida = `${ano}-${mes}-${dia}`;
        } else if (typeof item.data === 'string') {
          dataResolvida = item.data.substring(0, 10);
        }

        const tipoCultoFinal =
          item.tipoCulto ||
          (item.horarioManha || item.periodo === 'MANHA' ? 'MANHA' : 'NOITE');

        const horarioResolvido =
          item.horario ||
          item.hora ||
          (tipoCultoFinal === 'MANHA'
            ? item.horarioManha || '09:00'
            : item.horarioNoite || '19:00');

        const nomeCultoResolvido =
          item.nomeCulto ||
          item.culto ||
          (tipoCultoFinal === 'MANHA' ? 'Culto Matutino' : 'Culto de Celebração');

        return {
          id: item.id ?? idx,
          escalaId: item.escalaId ?? item.id ?? idx,
          dataEscala: dataResolvida,
          diaSemana: item.diaSemana || 'DOMINGO',
          tipoCulto: tipoCultoFinal,
          nomeCulto: nomeCultoResolvido,
          horario: String(horarioResolvido),
          instrumentoOuFuncao:
            item.instrumentoOuFuncao ||
            item.instrumento ||
            item.funcao ||
            'Músico',
          ministro: item.ministro || item.nomeMinistro || null,
          status: statusNormalizado,
          observacao: item.observacao || item.observacoes || null,
        };
      });

      formatados.sort((a, b) => (a.dataEscala > b.dataEscala ? 1 : -1));
      setEscalas(formatados);
    } catch (err: any) {
      setErro('Não foi possível carregar as escalas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarEscalas();
  }, [carregarEscalas]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarEscalas();
  };

  const handleConfirmar = async (escala: MinhaEscalaItemDTO) => {
    if (isDataPassada(escala.dataEscala)) return;

    try {
      setProcessandoId(escala.id);
      await api.put(`/escala-musicos/${escala.id}/confirmar`);

      setEscalas((prev) =>
        prev.map((e) => (e.id === escala.id ? { ...e, status: 'CONFIRMADO' } : e))
      );

      const msg = 'Presença confirmada com sucesso!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Escala Confirmada', msg);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao confirmar presença.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Aviso', msg);
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRecusar = (escala: MinhaEscalaItemDTO) => {
    if (isDataPassada(escala.dataEscala)) return;

    const executar = async () => {
      try {
        setProcessandoId(escala.id);
        await api.put(`/escala-musicos/${escala.id}/recusar`);

        setEscalas((prev) =>
          prev.map((e) => (e.id === escala.id ? { ...e, status: 'RECUSADO' } : e))
        );

        const msg = 'Recusa registrada no sistema.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Escala Recusada', msg);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Falha ao recusar escala.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Aviso', msg);
      } finally {
        setProcessandoId(null);
      }
    };

    const textoAviso = 'Deseja recusar esta escala? Avise a liderança para substituição.';
    if (Platform.OS === 'web') {
      if (window.confirm(textoAviso)) executar();
    } else {
      Alert.alert('Recusar Escala', textoAviso, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Recusar', style: 'destructive', onPress: executar },
      ]);
    }
  };

  const abrirSalaEnsaio = (escala: MinhaEscalaItemDTO) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('SalaEnsaio', { escalaId: escala.escalaId });
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '--/--/----';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  const renderBadgeStatus = (status: StatusPresenca, jaPassou: boolean) => {
    if (jaPassou) {
      return (
        <View style={[styles.statusBadge, styles.statusEncerrado]}>
          <CheckCheck size={12} color="#9CA3AF" />
          <Text style={[styles.statusTexto, { color: '#6B7280' }]}>
            {status === 'CONFIRMADO' ? 'Concluída' : 'Finalizada'}
          </Text>
        </View>
      );
    }

    if (status === 'CONFIRMADO') {
      return (
        <View style={[styles.statusBadge, styles.statusConfirmado]}>
          <CheckCircle2 size={12} color="#15803D" />
          <Text style={[styles.statusTexto, { color: '#15803D' }]}>Confirmado</Text>
        </View>
      );
    }
    if (status === 'RECUSADO') {
      return (
        <View style={[styles.statusBadge, styles.statusRecusado]}>
          <XCircle size={12} color="#B91C1C" />
          <Text style={[styles.statusTexto, { color: '#B91C1C' }]}>Recusado</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPendente]}>
        <AlertCircle size={12} color="#B45309" />
        <Text style={[styles.statusTexto, { color: '#B45309' }]}>Pendente</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: MinhaEscalaItemDTO }) => {
    const isManha = item.tipoCulto === 'MANHA';
    const ocupado = processandoId === item.id;
    const jaPassou = isDataPassada(item.dataEscala);

    return (
      <View style={[styles.card, jaPassou && styles.cardPassado]}>
        <View style={styles.cardHeader}>
          <View style={[styles.dateBadge, jaPassou && styles.dateBadgePassado]}>
            <Calendar size={13} color={jaPassou ? '#9CA3AF' : '#FF6B00'} />
            <Text style={[styles.dateText, jaPassou && { color: '#6B7280' }]}>
              {formatarData(item.dataEscala)}
            </Text>
          </View>
          {renderBadgeStatus(item.status, jaPassou)}
        </View>

        <View style={styles.cultoRow}>
          {isManha ? (
            <Sun size={15} color={jaPassou ? '#9CA3AF' : '#EA580C'} />
          ) : (
            <Moon size={15} color={jaPassou ? '#9CA3AF' : '#6366F1'} />
          )}
          <Text style={[styles.cultoTitulo, jaPassou && { color: '#6B7280' }]}>
            {item.nomeCulto}
          </Text>
          {item.horario ? (
            <View style={styles.horarioBadge}>
              <Clock size={11} color="#6B7280" />
              <Text style={styles.horarioTexto}>{item.horario.substring(0, 5)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.roleRow}>
            <Music size={15} color={jaPassou ? '#9CA3AF' : '#FF6B00'} />
            <Text style={styles.roleLabel}>Função:</Text>
            <Text style={[styles.roleText, jaPassou && { color: '#6B7280' }]}>
              {item.instrumentoOuFuncao}
            </Text>
          </View>

          {item.ministro ? (
            <View style={styles.roleRow}>
              <User size={15} color="#9CA3AF" />
              <Text style={styles.roleLabel}>Ministro:</Text>
              <Text style={styles.ministroText}>{item.ministro}</Text>
            </View>
          ) : null}

          {item.observacao ? (
            <Text style={styles.obsText}>{item.observacao}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.btnSalaEnsaio, jaPassou && styles.btnSalaEnsaioPassado]}
          onPress={() => abrirSalaEnsaio(item)}
          activeOpacity={0.8}
        >
          <Headphones size={15} color={jaPassou ? '#9CA3AF' : '#FF6B00'} />
          <Text style={[styles.btnSalaEnsaioTexto, jaPassou && { color: '#9CA3AF' }]}>
            Consultar Repertório
          </Text>
        </TouchableOpacity>

        {jaPassou ? (
          <View style={styles.cardPassadoAviso}>
            <CheckCheck size={14} color="#9CA3AF" />
            <Text style={styles.cardPassadoTexto}>Escala finalizada • Somente leitura</Text>
          </View>
        ) : (
          <View style={styles.cardAcoes}>
            {ocupado ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    styles.btnConfirmar,
                    item.status === 'CONFIRMADO' && styles.btnDesabilitado,
                  ]}
                  onPress={() => handleConfirmar(item)}
                  disabled={item.status === 'CONFIRMADO'}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={15} color="#FFFFFF" />
                  <Text style={styles.btnTextoBranco}>
                    {item.status === 'CONFIRMADO' ? 'Confirmado' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>

                {item.status !== 'RECUSADO' && (
                  <TouchableOpacity
                    style={[styles.btnAcao, styles.btnRecusar]}
                    onPress={() => handleRecusar(item)}
                    activeOpacity={0.8}
                  >
                    <XCircle size={15} color="#DC2626" />
                    <Text style={styles.btnTextoRecusar}>Recusar</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Buscando suas escalas...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <Text style={styles.errorText}>{erro}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarEscalas} activeOpacity={0.85}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.titleBar}>
        <Text style={styles.pageTitle}>Minhas Escalas</Text>
        <Text style={styles.pageSubtitle}>Confira suas próximas participações</Text>
      </View>

      <FlatList
        data={escalas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Calendar size={36} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Sem escalas agendadas</Text>
            <Text style={styles.emptyText}>
              Você não possui nenhuma escala pendente ou confirmada no momento.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  titleBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPassado: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.75,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  dateBadgePassado: {
    backgroundColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B00',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmado: {
    backgroundColor: '#DCFCE7',
  },
  statusRecusado: {
    backgroundColor: '#FEE2E2',
  },
  statusPendente: {
    backgroundColor: '#FEF3C7',
  },
  statusEncerrado: {
    backgroundColor: '#F3F4F6',
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  cultoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cultoTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  horarioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  horarioTexto: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '700',
  },
  cardBody: {
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  ministroText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  obsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  btnSalaEnsaio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 12,
  },
  btnSalaEnsaioPassado: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  btnSalaEnsaioTexto: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
  },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  cardPassadoAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  cardPassadoTexto: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  btnAcao: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnConfirmar: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  btnRecusar: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  btnDesabilitado: {
    backgroundColor: '#15803D',
    opacity: 0.85,
    elevation: 0,
  },
  btnTextoBranco: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextoRecusar: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B00',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

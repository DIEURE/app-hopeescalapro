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
import { colors } from '../../config/theme';

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
          <CheckCheck size={12} color={colors.textMuted} />
          <Text style={[styles.statusTexto, { color: colors.textMuted }]}>
            {status === 'CONFIRMADO' ? 'Concluída' : 'Finalizada'}
          </Text>
        </View>
      );
    }

    if (status === 'CONFIRMADO') {
      return (
        <View style={[styles.statusBadge, styles.statusConfirmado]}>
          <CheckCircle2 size={12} color="#22c55e" />
          <Text style={[styles.statusTexto, { color: '#22c55e' }]}>Confirmado</Text>
        </View>
      );
    }
    if (status === 'RECUSADO') {
      return (
        <View style={[styles.statusBadge, styles.statusRecusado]}>
          <XCircle size={12} color="#ef4444" />
          <Text style={[styles.statusTexto, { color: '#ef4444' }]}>Recusado</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPendente]}>
        <AlertCircle size={12} color="#f59e0b" />
        <Text style={[styles.statusTexto, { color: '#f59e0b' }]}>Pendente</Text>
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
            <Calendar size={14} color={jaPassou ? colors.textMuted : colors.primary} />
            <Text style={[styles.dateText, jaPassou && { color: colors.textMuted }]}>
              {formatarData(item.dataEscala)}
            </Text>
          </View>
          {renderBadgeStatus(item.status, jaPassou)}
        </View>

        <View style={styles.cultoRow}>
          {isManha ? (
            <Sun size={14} color={jaPassou ? colors.textMuted : '#ea580c'} />
          ) : (
            <Moon size={14} color={jaPassou ? colors.textMuted : colors.primary} />
          )}
          <Text style={[styles.cultoTitulo, jaPassou && { color: colors.textSecondary }]}>
            {item.nomeCulto}
          </Text>
          {item.horario ? (
            <View style={styles.horarioBadge}>
              <Clock size={11} color={colors.textSecondary} />
              <Text style={styles.horarioTexto}>{item.horario.substring(0, 5)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.roleRow}>
            <Music size={16} color={jaPassou ? colors.textMuted : colors.primary} />
            <Text style={styles.roleLabel}>Função:</Text>
            <Text style={[styles.roleText, jaPassou && { color: colors.textSecondary }]}>
              {item.instrumentoOuFuncao}
            </Text>
          </View>

          {item.ministro ? (
            <View style={styles.roleRow}>
              <User size={15} color={colors.textSecondary} />
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
          <Headphones size={15} color={jaPassou ? colors.textMuted : colors.primary} />
          <Text style={[styles.btnSalaEnsaioTexto, jaPassou && { color: colors.textMuted }]}>
            Consultar Repertório
          </Text>
        </TouchableOpacity>

        {jaPassou ? (
          <View style={styles.cardPassadoAviso}>
            <CheckCheck size={14} color={colors.textMuted} />
            <Text style={styles.cardPassadoTexto}>Escala finalizada • Somente leitura</Text>
          </View>
        ) : (
          <View style={styles.cardAcoes}>
            {ocupado ? (
              <ActivityIndicator size="small" color={colors.primary} />
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
                  <CheckCircle2 size={15} color="#ffffff" />
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
                    <XCircle size={15} color="#ef4444" />
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando suas escalas...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{erro}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarEscalas}>
          <RefreshCw size={16} color="#ffffff" />
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.cardBorder} />
            <Text style={styles.emptyText}>Nenhuma escala agendada para você no momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  titleBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardPassado: {
    opacity: 0.72,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  dateBadgePassado: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmado: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusRecusado: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPendente: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusEncerrado: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  cultoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cultoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  horarioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
  },
  horarioTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardBody: {
    gap: 6,
    paddingVertical: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ministroText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  obsText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  btnSalaEnsaio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  btnSalaEnsaioPassado: {
    borderColor: colors.cardBorder,
    backgroundColor: 'transparent',
  },
  btnSalaEnsaioTexto: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cardPassadoAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cardPassadoTexto: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  btnAcao: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnConfirmar: {
    backgroundColor: '#16a34a',
  },
  btnRecusar: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  btnDesabilitado: {
    backgroundColor: '#15803d',
    opacity: 0.8,
  },
  btnTextoBranco: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextoRecusar: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

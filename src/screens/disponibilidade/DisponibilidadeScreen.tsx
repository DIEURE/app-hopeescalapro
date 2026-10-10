import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Save,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react-native';

import {api} from '../../services/api';

interface CultoItem {
  data: string; // YYYY-MM-DD
  nome?: string;
  horario?: string;
  tipoCulto?: string;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export default function DisponibilidadeScreen() {
  const navigation = useNavigation<any>();
  const hoje = new Date();

  // Próximo mês por padrão se hoje for dia 15 ou mais
  const mesInicialPadrao = hoje.getDate() >= 15
    ? (hoje.getMonth() + 2 > 12 ? 1 : hoje.getMonth() + 2)
    : hoje.getMonth() + 1;

  const anoInicialPadrao = hoje.getDate() >= 15 && hoje.getMonth() === 11
    ? hoje.getFullYear() + 1
    : hoje.getFullYear();

  const [mes, setMes] = useState<number>(mesInicialPadrao);
  const [ano, setAno] = useState<number>(anoInicialPadrao);

  const [cultosDoMes, setCultosDoMes] = useState<CultoItem[]>([]);
  const [datasMarcadas, setDatasMarcadas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Regra do dia 25
  const expirouPrazo =
    hoje.getDate() > 25 &&
    mes === hoje.getMonth() + 1 &&
    ano === hoje.getFullYear();

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const [resCultos, resMinhas] = await Promise.all([
        api.get(`/agenda-mensal/datas?mes=${mes}&ano=${ano}`),
        api.get(`/disponibilidades/mes?mes=${mes}&ano=${ano}`),
      ]);

      const listaCultos = Array.isArray(resCultos.data) ? resCultos.data : [];
      const listaMarcadas = Array.isArray(resMinhas.data) ? resMinhas.data : [];

      setCultosDoMes(listaCultos);
      setDatasMarcadas(listaMarcadas);
    } catch (err: any) {
      console.error('Erro ao carregar dados de disponibilidade:', err);
      Alert.alert(
        'Atenção',
        'Não foi possível carregar a agenda de cultos para este mês.'
      );
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const mudarMes = (direcao: 'ant' | 'prox') => {
    if (direcao === 'ant') {
      if (mes === 1) {
        setMes(12);
        setAno(ano - 1);
      } else {
        setMes(mes - 1);
      }
    } else {
      if (mes === 12) {
        setMes(1);
        setAno(ano + 1);
      } else {
        setMes(mes + 1);
      }
    }
  };

  const toggleData = (dataStr: string) => {
    setDatasMarcadas((prev) =>
      prev.includes(dataStr) ? prev.filter((d) => d !== dataStr) : [...prev, dataStr]
    );
  };

  const marcarTodos = () => {
    const todas = cultosDoMes.map((c) => c.data);
    setDatasMarcadas(todas);
  };

  const desmarcarTodos = () => {
    setDatasMarcadas([]);
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await api.post(`/disponibilidades/salvar-lote?mes=${mes}&ano=${ano}`, datasMarcadas);

      Alert.alert(
        'Disponibilidade Salva',
        `Sua resposta com ${datasMarcadas.length} culto(s) selecionado(s) foi salva com sucesso!`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Ocorreu um erro ao salvar sua disponibilidade. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setSalvando(false);
    }
  };

  const formatarDataExibicao = (dataStr: string) => {
    if (!dataStr) return { dia: '--', diaSemana: '', sigla: '' };
    const partes = dataStr.split('-');
    if (partes.length !== 3) return { dia: '--', diaSemana: '', sigla: '' };

    const anoD = Number(partes[0]);
    const mesD = Number(partes[1]) - 1;
    const diaD = Number(partes[2]);

    const dataObj = new Date(anoD, mesD, diaD);
    const diaSemanaTexto = DIAS_SEMANA[dataObj.getDay()] || '';

    return {
      dia: String(diaD).padStart(2, '0'),
      diaSemana: diaSemanaTexto,
      sigla: diaSemanaTexto.substring(0, 3).toUpperCase(),
    };
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnVoltar}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.headerTitulo}>Disponibilidade de Escala</Text>
          <Text style={styles.headerSub}>Marque os dias em que você pode servir</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
            colors={['#00ff55']}
          />
        }
      >
        {/* CARD REGRA DO DIA 25 */}
        <View
          style={[
            styles.cardRegra,
            expirouPrazo ? styles.cardRegraExpirada : styles.cardRegraNormal,
          ]}
        >
          <Clock
            size={18}
            color={expirouPrazo ? '#B45309' : '#FF6B00'}
            style={{ marginTop: 2 }}
          />
          <View style={styles.cardRegraCorpo}>
            <Text
              style={[
                styles.cardRegraTitulo,
                { color: expirouPrazo ? '#92400E' : '#1F2937' },
              ]}
            >
              Regra do Prazo Limite (Dia 25)
            </Text>
            <Text
              style={[
                styles.cardRegraTexto,
                { color: expirouPrazo ? '#B45309' : '#4B5563' },
              ]}
            >
              {expirouPrazo
                ? 'O prazo do dia 25 para este mês foi encerrado. A liderança pode considerar toda a equipe no rodízio tradicional.'
                : 'Preencha até o dia 25 para garantir sua preferência no gerador automático de escalas.'}
            </Text>
          </View>
        </View>

        {/* NAVEGADOR DE MÊS */}
        <View style={styles.navegadorMes}>
          <TouchableOpacity
            style={styles.btnMesNav}
            activeOpacity={0.7}
            onPress={() => mudarMes('ant')}
          >
            <ChevronLeft size={18} color="#4B5563" />
            <Text style={styles.btnMesNavTexto}>Anterior</Text>
          </TouchableOpacity>

          <View style={styles.infoMesCentral}>
            <Text style={styles.mesAnoTexto}>
              {NOMES_MESES[mes - 1]} / {ano}
            </Text>
            <Text style={styles.contadorMarcadas}>
              {datasMarcadas.length} culto(s) selecionado(s)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnMesNav}
            activeOpacity={0.7}
            onPress={() => mudarMes('prox')}
          >
            <Text style={styles.btnMesNavTexto}>Próximo</Text>
            <ChevronRight size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* AÇÕES RÁPIDAS: MARCAR / DESMARCAR TODOS */}
        <View style={styles.acoesRapidasLinha}>
          <TouchableOpacity activeOpacity={0.7} onPress={marcarTodos}>
            <Text style={styles.linkAcaoLaranja}>Marcar todos</Text>
          </TouchableOpacity>
          <Text style={styles.separadorDot}>•</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={desmarcarTodos}>
            <Text style={styles.linkAcaoVermelho}>Desmarcar todos</Text>
          </TouchableOpacity>
        </View>

        {/* LISTAGEM DE CULTOS */}
        {carregando && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingTexto}>Carregando agenda do mês...</Text>
          </View>
        ) : cultosDoMes.length === 0 ? (
          <View style={styles.vazioContainer}>
            <CalendarDays size={32} color="#9CA3AF" />
            <Text style={styles.vazioTitulo}>Nenhum culto agendado</Text>
            <Text style={styles.vazioSub}>
              A liderança ainda não cadastrou a agenda oficial para {NOMES_MESES[mes - 1]} de {ano}.
            </Text>
          </View>
        ) : (
          <View style={styles.listaCultos}>
            {cultosDoMes.map((culto) => {
              const marcado = datasMarcadas.includes(culto.data);
              const info = formatarDataExibicao(culto.data);

              return (
                <TouchableOpacity
                  key={culto.data}
                  activeOpacity={0.8}
                  style={[
                    styles.cardCulto,
                    marcado && styles.cardCultoMarcado,
                  ]}
                  onPress={() => toggleData(culto.data)}
                >
                  <View style={styles.cultoEsquerda}>
                    {/* BLOCO DA DATA */}
                    <View
                      style={[
                        styles.badgeData,
                        marcado ? styles.badgeDataMarcado : styles.badgeDataNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeDiaNumero,
                          marcado && styles.badgeTextoBranco,
                        ]}
                      >
                        {info.dia}
                      </Text>
                      <Text
                        style={[
                          styles.badgeDiaSemanaSigla,
                          marcado && styles.badgeTextoBranco,
                        ]}
                      >
                        {info.sigla}
                      </Text>
                    </View>

                    {/* DETALHES DO CULTO */}
                    <View style={styles.cultoInfo}>
                      <Text style={styles.cultoNome} numberOfLines={1}>
                        {culto.nome || 'Culto de Celebração'}
                      </Text>
                      <Text style={styles.cultoSub}>
                        {info.diaSemana} • {culto.horario || 'Horário normal'}
                      </Text>
                    </View>
                  </View>

                  {/* CHECKBOX */}
                  <View style={styles.cultoDireita}>
                    {marcado ? (
                      <CheckCircle2 size={24} color="#039b03" />
                    ) : (
                      <Circle size={24} color="#D1D5DB" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* BOTÃO FIXO INFERIOR */}
      <View style={styles.rodapeFixo}>
        <TouchableOpacity
          style={[
            styles.btnSalvar,
            (salvando || carregando) && styles.btnSalvarDesabilitado,
          ]}
          activeOpacity={0.85}
          disabled={salvando || carregando}
          onPress={handleSalvar}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.btnSalvarTexto}>
                Salvar Disponibilidade ({datasMarcadas.length} cultos)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f3f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  btnVoltar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextos: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  cardRegra: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
  },
  cardRegraNormal: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  cardRegraExpirada: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  cardRegraCorpo: {
    flex: 1,
  },
  cardRegraTitulo: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardRegraTexto: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  navegadorMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  btnMesNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  btnMesNavTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  infoMesCentral: {
    alignItems: 'center',
  },
  mesAnoTexto: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  contadorMarcadas: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
    fontWeight: '500',
  },
  acoesRapidasLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  linkAcaoLaranja: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e340a',
    textDecorationLine: 'underline',
  },
  separadorDot: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  linkAcaoVermelho: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTexto: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  vazioContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    gap: 8,
  },
  vazioTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  vazioSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  listaCultos: {
    gap: 10,
  },
  cardCulto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardCultoMarcado: {
    borderColor: '#039b03',
    backgroundColor: '#FFF8F2',
  },
  cultoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  badgeData: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDataNormal: {
    backgroundColor: '#F3F4F6',
  },
  badgeDataMarcado: {
    backgroundColor: '#039b03',
  },
  badgeDiaNumero: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 18,
  },
  badgeDiaSemanaSigla: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  badgeTextoBranco: {
    color: '#FFFFFF',
  },
  cultoInfo: {
    flex: 1,
  },
  cultoNome: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  cultoSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  cultoDireita: {
    paddingLeft: 6,
  },
  rodapeFixo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnSalvar: {
    backgroundColor: '#FF6B00',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSalvarDesabilitado: {
    opacity: 0.6,
  },
  btnSalvarTexto: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
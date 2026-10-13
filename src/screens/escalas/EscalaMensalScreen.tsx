import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import {
  Calendar,
  Send,
  ChevronLeft,
  ChevronRight,
  Users,
  Copy,
  Check,
  Lock,
  UserX,
  AlertCircle,
} from 'lucide-react-native';

import { buscarEscalasMes } from '../../services/escalaService';
import {api} from '../../services/api';
import { isDataPassada, formatarDataBr } from '../../utils/dateUtils';

interface VoluntarioEscala {
  id: number;
  usuarioId?: number | null;
  nome?: string | null;
  instrumento?: string;
  funcao?: string;
  vago?: boolean;
}

interface EscalaItem {
  id?: number;
  escalaId?: number;
  data?: string;
  dataEscala?: string;
  voluntarios?: VoluntarioEscala[];
}

interface EscalaMensalDashboardProps {
  departamentoId?: number;
  nomeDepartamento?: string;
  perfilUsuario?: 'ADMIN' | 'SUPER_ADMIN' | 'LIDER' | 'VOLUNTARIO' | string;
}

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function EscalaMensalDashboardScreen({
  departamentoId = 2,
  nomeDepartamento = 'Ministério de Louvor',
  perfilUsuario = 'ADMIN',
}: EscalaMensalDashboardProps) {
  const dataAtualReferencia = new Date();
  const [mes, setMes] = useState<number>(dataAtualReferencia.getMonth() + 1);
  const [ano, setAno] = useState<number>(dataAtualReferencia.getFullYear());

  const [escalasMes, setEscalasMes] = useState<EscalaItem[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const podeGerenciar = ['ADMIN', 'SUPER_ADMIN', 'LIDER'].includes(perfilUsuario);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErroMsg(null);
      const dados: any = await buscarEscalasMes(departamentoId, mes, ano);
      const lista: EscalaItem[] = Array.isArray(dados)
        ? dados
        : dados?.content || dados?.escalas || [];
      setEscalasMes(lista);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao consultar escalas';
      setErroMsg(msg);
      setEscalasMes([]);
    } finally {
      setCarregando(false);
    }
  }, [departamentoId, mes, ano]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mudarMes = (direcao: 'ant' | 'prox') => {
    if (direcao === 'ant') {
      if (mes === 1) {
        setMes(12);
        setAno((prev) => prev - 1);
      } else {
        setMes((prev) => prev - 1);
      }
    } else {
      if (mes === 12) {
        setMes(1);
        setAno((prev) => prev + 1);
      } else {
        setMes((prev) => prev + 1);
      }
    }
  };

  const obterDataIso = (escala: EscalaItem): string => {
    const raw = escala.dataEscala || escala.data || '';
    if (typeof raw === 'string') {
      return raw.split('T')[0];
    }
    return '';
  };

  const extrairData = (escala: EscalaItem) => {
    const dataIso = obterDataIso(escala);
    if (dataIso.includes('-')) {
      const [anoStr, mesStr, diaStr] = dataIso.split('-');
      return {
        ano: parseInt(anoStr, 10),
        mes: parseInt(mesStr, 10),
        dia: parseInt(diaStr, 10),
        formatada: `${diaStr}/${mesStr}`,
        completa: formatarDataBr ? formatarDataBr(dataIso) : `${diaStr}/${mesStr}/${anoStr}`,
      };
    }
    return { ano, mes, dia: 1, formatada: '--/--', completa: '--/--/----' };
  };

  const ehEscalaPassada = (escala: EscalaItem): boolean => {
    const dataIso = obterDataIso(escala);
    if (!dataIso) return false;
    return isDataPassada(dataIso);
  };

  const executarDesocupacao = async (
    targetEscalaId: number,
    vagaId: number
  ) => {
    try {
      await api.patch(`/escala-musicos/${vagaId}/desocupar`);

      setEscalasMes((prev) =>
        prev.map((esc) => {
          const idAtual = esc.id || esc.escalaId;
          if (idAtual !== targetEscalaId) return esc;
          return {
            ...esc,
            voluntarios: (esc.voluntarios || []).map((vol) => {
              if (vol.id === vagaId || vol.usuarioId === vagaId) {
                return { ...vol, nome: null, usuarioId: null, vago: true };
              }
              return vol;
            }),
          };
        })
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Não foi possível desocupar a vaga no servidor.';
      Alert.alert('Erro', msg);
    }
  };

  const handleTornarVago = (
    escalaId: number | undefined,
    vagaId: number | undefined,
    instrumento: string,
    isPassada: boolean
  ) => {
    if (isPassada) {
      Alert.alert('Ação bloqueada', 'Não é permitido modificar postos de cultos já encerrados.');
      return;
    }

    if (!vagaId || !escalaId) {
      Alert.alert('Atenção', 'Identificador de vaga ou escala não localizado.');
      return;
    }

    Alert.alert(
      'Desocupar Vaga',
      `Deseja desocupar a vaga de "${instrumento}" mantendo o posto em aberto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, desocupar',
          style: 'destructive',
          onPress: () => executarDesocupacao(escalaId, vagaId),
        },
      ]
    );
  };

  const gerarTextoWhatsApp = (): string => {
    const nomeMes = NOMES_MESES[mes - 1];
    let texto = `🗓️ *ESCALA GERAL DE VOLUNTÁRIOS – ${nomeMes.toUpperCase()}/${ano}*\n`;
    texto += `*${nomeDepartamento}*\n\n`;

    escalasMes.forEach((escala, index) => {
      const dataInfo = extrairData(escala);
      texto += `🗓️ *SEMANA ${index + 1} – Data: ${dataInfo.formatada}*\n`;

      const lista = escala.voluntarios || [];
      lista.forEach((vol) => {
        const funcao = vol.instrumento || vol.funcao || 'Voluntário';
        const nome = vol.nome && vol.nome.trim() !== '' && !vol.vago ? vol.nome : '⚠️ [VAGO]';
        texto += `• ${funcao}: ${nome}\n`;
      });
      texto += `\n`;
    });

    return texto;
  };

  const handleDispararWhatsApp = async () => {
    const texto = gerarTextoWhatsApp();
    const urlApp = `whatsapp://send?text=${encodeURIComponent(texto)}`;
    const urlWeb = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;

    try {
      const suportado = await Linking.canOpenURL(urlApp);
      if (suportado) {
        await Linking.openURL(urlApp);
      } else {
        await Linking.openURL(urlWeb);
      }
    } catch {
      Alert.alert('Atenção', 'Não foi possível iniciar o WhatsApp.');
    }
  };

  const handleCopiarOuCompartilhar = async () => {
    const texto = gerarTextoWhatsApp();
    try {
      await Share.share({
        message: texto,
        title: `Escala Mensal - ${NOMES_MESES[mes - 1]}/${ano}`,
      });
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar a escala.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* BARRA SUPERIOR */}
      <View style={styles.topCard}>
        <View style={styles.topInfoRow}>
          <View style={styles.iconeCalendarBox}>
            <Calendar size={20} color="#FF6B00" />
          </View>
          <View style={styles.topTitulosBox}>
            <Text style={styles.topTitulo}>
              Escala Mensal – {NOMES_MESES[mes - 1]} / {ano}
            </Text>
            <Text style={styles.topSubtitulo}>
              {nomeDepartamento} • Modo Administrativo
            </Text>
          </View>
        </View>

        <View style={styles.controlesRow}>
          {/* SELETOR DE MÊS */}
          <View style={styles.seletorMes}>
            <TouchableOpacity
              onPress={() => mudarMes('ant')}
              style={styles.btnNavMes}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color="#475569" />
            </TouchableOpacity>

            <Text style={styles.mesAtualTexto}>{NOMES_MESES[mes - 1]}</Text>

            <TouchableOpacity
              onPress={() => mudarMes('prox')}
              style={styles.btnNavMes}
              activeOpacity={0.7}
            >
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* AÇÕES (COMPARTILHAR / WHATSAPP) */}
          {podeGerenciar && (
            <View style={styles.acoesRow}>
              <TouchableOpacity
                onPress={handleCopiarOuCompartilhar}
                style={styles.btnAcaoSecundario}
                activeOpacity={0.7}
              >
                {copiado ? <Check size={14} color="#15803D" /> : <Copy size={14} color="#334155" />}
                <Text style={styles.btnAcaoSecundarioTexto}>
                  {copiado ? 'Enviado!' : 'Copiar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDispararWhatsApp}
                disabled={escalasMes.length === 0}
                style={[
                  styles.btnWhatsApp,
                  escalasMes.length === 0 && styles.btnDesabilitado,
                ]}
                activeOpacity={0.8}
              >
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.btnWhatsAppTexto}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* MENSAGEM DE ERRO */}
      {erroMsg && (
        <View style={styles.erroBox}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.erroTexto}>Aviso: {erroMsg}</Text>
        </View>
      )}

      {/* FEEDBACK DE CARREGAMENTO / VAZIO / CARDS */}
      {carregando ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#FF6B00" />
          <Text style={styles.carregandoTexto}>Carregando cultos do mês...</Text>
        </View>
      ) : escalasMes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTexto}>
            Nenhuma escala encontrada para {NOMES_MESES[mes - 1]} de {ano}.
          </Text>
        </View>
      ) : (
        <View style={styles.listaCards}>
          {escalasMes.map((escala, index) => {
            const dataInfo = extrairData(escala);
            const voluntarios = escala.voluntarios || [];
            const isPassada = ehEscalaPassada(escala);
            const idEscala = escala.id || escala.escalaId;

            const preenchidos = voluntarios.filter(
              (v) => v.nome && v.nome.trim() !== '' && !v.vago
            ).length;

            return (
              <View
                key={idEscala || index}
                style={[styles.cardEscala, isPassada && styles.cardEscalaPassada]}
              >
                {/* TOPO DO CARD */}
                <View
                  style={[
                    styles.cardHeader,
                    isPassada && styles.cardHeaderPassado,
                  ]}
                >
                  <View style={styles.cardHeaderEsquerda}>
                    <Text
                      style={[
                        styles.badgeSemana,
                        isPassada && styles.badgeSemanaPassada,
                      ]}
                    >
                      SEMANA {index + 1}
                    </Text>

                    {isPassada && (
                      <View style={styles.badgeLeitura}>
                        <Lock size={10} color="#64748B" />
                        <Text style={styles.badgeLeituraTexto}>Somente Leitura</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.badgeData,
                      isPassada && styles.badgeDataPassada,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeDataTexto,
                        isPassada && styles.badgeDataTextoPassada,
                      ]}
                    >
                      {dataInfo.formatada}
                    </Text>
                  </View>
                </View>

                {/* LISTAGEM DE FUNÇÕES / INSTRUMENTOS */}
                <View style={styles.voluntariosList}>
                  {voluntarios.length > 0 ? (
                    voluntarios.map((vol, vIdx) => {
                      const instrumento = vol.instrumento || vol.funcao || 'Função';
                      const isVago = !vol.nome || vol.nome.trim() === '' || vol.vago === true;

                      return (
                        <View
                          key={vol.id || vol.usuarioId || vIdx}
                          style={[
                            styles.linhaVoluntario,
                            isVago && styles.linhaVoluntarioVago,
                            isPassada && styles.linhaVoluntarioPassado,
                          ]}
                        >
                          <Text
                            style={[
                              styles.instrumentoTexto,
                              isPassada && styles.instrumentoTextoPassado,
                            ]}
                            numberOfLines={1}
                          >
                            {instrumento}
                          </Text>

                          <View style={styles.voluntarioAcaoBox}>
                            {isVago ? (
                              <View style={styles.vagoBadge}>
                                <AlertCircle size={10} color="#D97706" />
                                <Text style={styles.vagoTexto}>[VAGO]</Text>
                              </View>
                            ) : (
                              <>
                                <Text
                                  style={[
                                    styles.nomeVoluntario,
                                    isPassada && styles.nomeVoluntarioPassado,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {vol.nome}
                                </Text>

                                {!isPassada && podeGerenciar && (
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleTornarVago(
                                        idEscala,
                                        vol.id,
                                        instrumento,
                                        isPassada
                                      )
                                    }
                                    style={styles.btnDesocupar}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  >
                                    <UserX size={13} color="#EF4444" />
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.semPostosTexto}>
                      Nenhum posto definido nesta escala
                    </Text>
                  )}
                </View>

                {/* RODAPÉ DO CARD */}
                <View
                  style={[
                    styles.cardFooter,
                    isPassada && styles.cardFooterPassado,
                  ]}
                >
                  <View style={styles.vagasInfo}>
                    <Users size={12} color="#94A3B8" />
                    <Text style={styles.vagasTexto}>
                      {preenchidos}/{voluntarios.length} vagas preenchidas
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.statusDiaTexto,
                      isPassada && styles.statusDiaPassado,
                    ]}
                  >
                    {isPassada ? 'Encerrado' : 'Domingo'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconeCalendarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topTitulosBox: {
    flex: 1,
  },
  topTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  topSubtitulo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  controlesRow: {
    flexDirection: 'column',
    gap: 8,
  },
  seletorMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnNavMes: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  mesAtualTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  acoesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnAcaoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 8,
  },
  btnAcaoSecundarioTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  btnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 8,
  },
  btnWhatsAppTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDesabilitado: {
    opacity: 0.5,
  },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  erroTexto: {
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
  },
  centerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carregandoTexto: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyTexto: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  listaCards: {
    flexDirection: 'column',
    gap: 12,
  },
  cardEscala: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  cardEscalaPassada: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderPassado: {
    borderBottomColor: '#E2E8F0',
  },
  cardHeaderEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeSemana: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  badgeSemanaPassada: {
    color: '#64748B',
  },
  badgeLeitura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLeituraTexto: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  badgeData: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDataPassada: {
    backgroundColor: '#E2E8F0',
  },
  badgeDataTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeDataTextoPassada: {
    color: '#475569',
  },
  voluntariosList: {
    flexDirection: 'column',
    gap: 6,
  },
  linhaVoluntario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  linhaVoluntarioVago: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  linhaVoluntarioPassado: {
    backgroundColor: '#E2E8F0',
  },
  instrumentoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  instrumentoTextoPassado: {
    color: '#64748B',
  },
  voluntarioAcaoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vagoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vagoTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  nomeVoluntario: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 130,
  },
  nomeVoluntarioPassado: {
    color: '#475569',
  },
  btnDesocupar: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  semPostosTexto: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterPassado: {
    borderTopColor: '#E2E8F0',
  },
  vagasInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vagasTexto: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statusDiaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusDiaPassado: {
    color: '#94A3B8',
  },
});
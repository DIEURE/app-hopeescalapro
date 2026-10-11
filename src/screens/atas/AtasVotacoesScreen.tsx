import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Bell,
  FileText,
  CheckCircle,
  Clock,
  ChevronRight,
  Vote,
  X,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
} from 'lucide-react-native';

import {api} from '../../services/api';
import { ataService, Ata, Pauta, OpcaoPauta } from '../../services/ataService';

interface UsuarioVoto {
  id: number;
  nome: string;
  avatarUrl?: string;
  opcaoEscolhidaId?: number;
  opcaoEscolhidaTexto?: string;
}

interface PautaComContexto extends Pauta {
  ataId: number;
  ataTitulo: string;
  dataReuniao?: string;
  minhaOpcaoEscolhidaId?: number | null;
  totalVotosGeral?: number;
  votaram?: UsuarioVoto[];
  pendentes?: UsuarioVoto[];
}

interface AlertaSino {
  id: string;
  tipo: 'VOTACAO' | 'ESCALA';
  titulo: string;
  mensagem: string;
  data?: string;
}

export default function AtasVotacoesScreen() {
  const [abaAtiva, setAbaAtiva] = useState<'votacoes' | 'atas'>('votacoes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [atas, setAtas] = useState<Ata[]>([]);
  const [pautasAtivas, setPautasAtivas] = useState<PautaComContexto[]>([]);
  const [alertasSino, setAlertasSino] = useState<AlertaSino[]>([]);

  const [pautaAbertaVotantes, setPautaAbertaVotantes] = useState<number | null>(null);
  const [subAbaVotantes, setSubAbaVotantes] = useState<'votaram' | 'pendentes'>('votaram');

  const [modalSinoAberto, setModalSinoAberto] = useState(false);
  const [ataDetalheModal, setAtaDetalheModal] = useState<Ata | null>(null);
  const [votandoPautaId, setVotandoPautaId] = useState<number | null>(null);

  const carregarDadosCompletos = useCallback(async () => {
    try {
      const listaGeral = await ataService.listar();
      const arrayAtas = Array.isArray(listaGeral) ? listaGeral : [];
      setAtas(arrayAtas);

      const atasParaDetalhar = arrayAtas.slice(0, 8);
      const detalhesResolvidos = await Promise.allSettled(
        atasParaDetalhar.map((a) => ataService.buscarPorId(a.id))
      );

      const pautasEmVotacao: PautaComContexto[] = [];

      detalhesResolvidos.forEach((resultado) => {
        if (resultado.status === 'fulfilled' && resultado.value) {
          const ataCompleta = resultado.value;
          if (ataCompleta.pautas && Array.isArray(ataCompleta.pautas)) {
            ataCompleta.pautas.forEach((pauta: any) => {
              const statusVot = String(pauta.statusVotacao || '').toUpperCase();
              if (statusVot === 'EM_VOTACAO') {
                const idOpcaoVotada = pauta.minhaOpcaoEscolhidaId ?? pauta.meuVotoOpcaoId ?? null;
                const jaVotou = idOpcaoVotada != null || Boolean(pauta.jaVotou);

                pautasEmVotacao.push({
                  ...pauta,
                  ataId: ataCompleta.id,
                  ataTitulo: ataCompleta.titulo,
                  dataReuniao: ataCompleta.dataReuniao,
                  minhaOpcaoEscolhidaId: idOpcaoVotada,
                  jaVotou,
                  votaram: pauta.votaram || [],
                  pendentes: pauta.pendentes || [],
                });
              }
            });
          }
        }
      });

      setPautasAtivas(pautasEmVotacao);

      const novosAlertas: AlertaSino[] = [];
      pautasEmVotacao
        .filter((p) => !p.jaVotou)
        .forEach((pauta) => {
          novosAlertas.push({
            id: `vot-${pauta.id}`,
            tipo: 'VOTACAO',
            titulo: 'Votação Aberta!',
            mensagem: `${pauta.titulo} (${pauta.ataTitulo})`,
            data: pauta.dataReuniao || 'Reunião ativa',
          });
        });

      

      setAlertasSino(novosAlertas);
    } catch (err: any) {
      console.warn('Erro ao carregar atas:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDadosCompletos();
    }, [carregarDadosCompletos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarDadosCompletos();
  };

  const handleVotar = async (pautaId: number, opcaoId: number) => {
    try {
      setVotandoPautaId(pautaId);
      await ataService.votarPauta(pautaId, opcaoId);

      Alert.alert('Sucesso!', 'Seu voto foi registrado com sucesso.');

      setPautasAtivas((prev) =>
        prev.map((p) => {
          if (p.id !== pautaId) return p;
          const novoTotal = (p.totalVotosGeral || 0) + 1;
          return {
            ...p,
            jaVotou: true,
            minhaOpcaoEscolhidaId: opcaoId,
            totalVotosGeral: novoTotal,
            opcoes: (p.opcoes || []).map((op: any) => {
              const votoNesta = op.id === opcaoId;
              const votosOpcao = votoNesta ? (op.totalVotos || 0) + 1 : op.totalVotos;
              return {
                ...op,
                totalVotos: votosOpcao,
                porcentagem: novoTotal > 0 ? (votosOpcao / novoTotal) * 100 : 0,
              };
            }),
          };
        })
      );

      setAlertasSino((prev) => prev.filter((a) => a.id !== `vot-${pautaId}`));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível registrar seu voto.';
      Alert.alert('Atenção', msg);
    } finally {
      setVotandoPautaId(null);
    }
  };

  const toggleVotantes = (pautaId: number) => {
    setPautaAbertaVotantes((prev) => (prev === pautaId ? null : pautaId));
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>MINISTÉRIO & DECISÕES</Text>
          <Text style={styles.headerTitle}>Atas & Votações</Text>
        </View>

        <TouchableOpacity
          style={styles.btnSino}
          onPress={() => setModalSinoAberto(true)}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#1F2937" />
          {alertasSino.length > 0 && (
            <View style={styles.badgeSino}>
              <Text style={styles.badgeSinoTexto}>{alertasSino.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, abaAtiva === 'votacoes' && styles.tabButtonAtivo]}
          onPress={() => setAbaAtiva('votacoes')}
          activeOpacity={0.8}
        >
          <Vote size={16} color={abaAtiva === 'votacoes' ? '#FF6B00' : '#6B7280'} />
          <Text style={[styles.tabText, abaAtiva === 'votacoes' && styles.tabTextAtivo]}>
            Em Votação ({pautasAtivas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, abaAtiva === 'atas' && styles.tabButtonAtivo]}
          onPress={() => setAbaAtiva('atas')}
          activeOpacity={0.8}
        >
          <FileText size={16} color={abaAtiva === 'atas' ? '#FF6B00' : '#6B7280'} />
          <Text style={[styles.tabText, abaAtiva === 'atas' && styles.tabTextAtivo]}>
            Atas Registradas ({atas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Carregando deliberações...</Text>
        </View>
      ) : abaAtiva === 'votacoes' ? (
        <FlatList
          data={pautasAtivas}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />}
          contentContainerStyle={styles.listaContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitulo}>Nenhuma votação aberta no momento</Text>
              <Text style={styles.emptyDesc}>
                Quando a liderança abrir uma deliberação, as opções aparecerão aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const jaVotou = Boolean(item.jaVotou);
            const opcaoEscolhidaId = item.minhaOpcaoEscolhidaId;
            const isOpenVotantes = pautaAbertaVotantes === item.id;
            const listaVotaram = item.votaram || [];
            const listaPendentes = item.pendentes || [];
            const totalParticipantes = listaVotaram.length + listaPendentes.length;

            return (
              <View style={styles.cardItem}>
                <View style={styles.cardItemTopo}>
                  <View style={styles.badgeOrigem}>
                    <FileText size={12} color="#FF6B00" />
                    <Text style={styles.badgeOrigemTexto} numberOfLines={1}>
                      {item.ataTitulo}
                    </Text>
                  </View>

                  {jaVotou ? (
                    <View style={styles.badgeVotado}>
                      <CheckCircle size={12} color="#15803D" />
                      <Text style={styles.badgeVotadoTexto}>Voto Computado</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeAberta}>
                      <Clock size={12} color="#EA580C" />
                      <Text style={styles.badgeAbertaTexto}>Votação Aberta</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardItemTitulo}>{item.titulo}</Text>
                {item.descricao ? (
                  <Text style={styles.cardItemDesc}>{item.descricao}</Text>
                ) : null}

                {/* OPÇÕES COM BARRA DE PORCENTAGEM */}
                <View style={styles.opcoesLista}>
                  {item.opcoes && item.opcoes.length > 0 ? (
                    item.opcoes.map((opcao: any) => {
                      const foiEscolhida = opcaoEscolhidaId === opcao.id;
                      const pct = Math.round(opcao.porcentagem || 0);

                      return (
                        <TouchableOpacity
                          key={opcao.id}
                          style={[
                            styles.btnOpcaoVoto,
                            foiEscolhida && styles.btnOpcaoVotoAtiva,
                            jaVotou && !foiEscolhida && styles.btnOpcaoVotoDesabilitada,
                          ]}
                          disabled={jaVotou || votandoPautaId === item.id}
                          onPress={() => handleVotar(item.id, opcao.id)}
                          activeOpacity={0.8}
                        >
                          {/* Barra de preenchimento de fundo proporcional aos votos */}
                          {jaVotou && pct > 0 && (
                            <View
                              style={[
                                styles.barraProgressoFundo,
                                { width: `${pct}%` },
                                foiEscolhida && styles.barraProgressoFundoEscolhida,
                              ]}
                            />
                          )}

                          <Vote
                            size={14}
                            color={foiEscolhida ? '#FFFFFF' : '#FF6B00'}
                          />
                          <Text
                            style={[
                              styles.btnOpcaoVotoTexto,
                              foiEscolhida && styles.btnOpcaoVotoTextoAtivo,
                              jaVotou && !foiEscolhida && styles.btnOpcaoVotoTextoDesabilitada,
                            ]}
                            numberOfLines={1}
                          >
                            {opcao.texto || `Opção ${opcao.id}`}
                          </Text>

                          {jaVotou && (
                            <Text
                              style={[
                                styles.textoPorcentagem,
                                foiEscolhida && styles.textoPorcentagemAtiva,
                              ]}
                            >
                              {pct}%
                            </Text>
                          )}

                          {typeof opcao.totalVotos === 'number' && (
                            <View
                              style={[
                                styles.badgeQtdVotos,
                                foiEscolhida && styles.badgeQtdVotosAtiva,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeQtdVotosTexto,
                                  foiEscolhida && styles.badgeQtdVotosTextoAtivo,
                                ]}
                              >
                                {opcao.totalVotos}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.semOpcoesTexto}>
                      Nenhuma opção disponível nesta pauta.
                    </Text>
                  )}
                </View>

                {/* PAINEL RETRÁTIL: QUEM VOTOU / PENDENTES */}
                <TouchableOpacity
                  style={styles.painelVotantesToggle}
                  onPress={() => toggleVotantes(item.id)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.painelVotantesTitulo}>Quórum de Votação</Text>
                    <Text style={styles.painelVotantesContador}>
                      {listaVotaram.length}
                      {totalParticipantes > 0 ? ` de ${totalParticipantes}` : ''} votaram
                    </Text>
                  </View>

                  <View style={styles.painelVotantesIcon}>
                    {isOpenVotantes ? (
                      <ChevronUp size={16} color="#FF6B00" />
                    ) : (
                      <ChevronDown size={16} color="#6B7280" />
                    )}
                  </View>
                </TouchableOpacity>

                {isOpenVotantes && (
                  <View style={styles.secaoVotantesCorpo}>
                    <View style={styles.subTabsVotantes}>
                      <TouchableOpacity
                        style={[
                          styles.subTabBtn,
                          subAbaVotantes === 'votaram' && styles.subTabBtnAtivo,
                        ]}
                        onPress={() => setSubAbaVotantes('votaram')}
                      >
                        <UserCheck
                          size={13}
                          color={subAbaVotantes === 'votaram' ? '#15803D' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.subTabTexto,
                            subAbaVotantes === 'votaram' && styles.subTabTextoAtivoVerde,
                          ]}
                        >
                          Votaram ({listaVotaram.length})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.subTabBtn,
                          subAbaVotantes === 'pendentes' && styles.subTabBtnAtivo,
                        ]}
                        onPress={() => setSubAbaVotantes('pendentes')}
                      >
                        <UserX
                          size={13}
                          color={subAbaVotantes === 'pendentes' ? '#D97706' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.subTabTexto,
                            subAbaVotantes === 'pendentes' && styles.subTabTextoAtivoLaranja,
                          ]}
                        >
                          Pendentes ({listaPendentes.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {subAbaVotantes === 'votaram' ? (
                      listaVotaram.length === 0 ? (
                        <Text style={styles.semListaTexto}>Nenhum voto computado ainda.</Text>
                      ) : (
                        listaVotaram.map((v) => (
                          <View key={v.id} style={styles.linhaMembroVoto}>
                            <View style={styles.avatarMini}>
                              <Text style={styles.avatarMiniTexto}>
                                {v.nome ? v.nome.charAt(0).toUpperCase() : 'U'}
                              </Text>
                            </View>
                            <View style={styles.membroInfoBox}>
                              <Text style={styles.membroNome}>{v.nome}</Text>
                              {v.opcaoEscolhidaTexto ? (
                                <Text style={styles.membroEscolha}>
                                  Votou em: {v.opcaoEscolhidaTexto}
                                </Text>
                              ) : null}
                            </View>
                            <CheckCircle size={14} color="#15803D" />
                          </View>
                        ))
                      )
                    ) : listaPendentes.length === 0 ? (
                      <Text style={styles.semListaTexto}>Todos já participaram desta votação!</Text>
                    ) : (
                      listaPendentes.map((p) => (
                        <View key={p.id} style={styles.linhaMembroVoto}>
                          <View style={[styles.avatarMini, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.avatarMiniTexto, { color: '#B45309' }]}>
                              {p.nome ? p.nome.charAt(0).toUpperCase() : 'U'}
                            </Text>
                          </View>
                          <View style={styles.membroInfoBox}>
                            <Text style={styles.membroNome}>{p.nome}</Text>
                            <Text style={styles.membroStatusPendente}>Aguardando voto</Text>
                          </View>
                          <Clock size={14} color="#D97706" />
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={atas}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />}
          contentContainerStyle={styles.listaContent}
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <View style={styles.cardItemTopo}>
                <View style={styles.badgeOrigem}>
                  <Calendar size={12} color="#6B7280" />
                  <Text style={[styles.badgeOrigemTexto, { color: '#4B5563' }]}>
                    {item.dataReuniao || 'Data não definida'}
                  </Text>
                </View>
                <View
                  style={
                    item.status === 'CONCLUIDA'
                      ? styles.badgeVotado
                      : styles.badgeEmAndamento
                  }
                >
                  <Text
                    style={
                      item.status === 'CONCLUIDA'
                        ? styles.badgeVotadoTexto
                        : styles.badgeEmAndamentoTexto
                    }
                  >
                    {item.status === 'CONCLUIDA' ? 'Concluída' : 'Em Andamento'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardItemTitulo}>{item.titulo}</Text>

              {item.localReuniao ? (
                <View style={styles.linhaInfo}>
                  <MapPin size={12} color="#9CA3AF" />
                  <Text style={styles.textoInfo}>{item.localReuniao}</Text>
                </View>
              ) : null}

              {item.conteudoAta ? (
                <Text style={styles.cardItemDesc} numberOfLines={2}>
                  {item.conteudoAta}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.btnVerDetalhes}
                activeOpacity={0.7}
                onPress={async () => {
                  try {
                    const dados = await ataService.buscarPorId(item.id);
                    setAtaDetalheModal(dados);
                  } catch {
                    Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
                  }
                }}
              >
                <Text style={styles.btnVerDetalhesTexto}>Ver Pautas da Reunião</Text>
                <ChevronRight size={14} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* MODAL DO SINO */}
      <Modal visible={modalSinoAberto} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <Bell size={18} color="#FF6B00" />
                <Text style={styles.modalTitle}>Central de Alertas</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalSinoAberto(false)}
                style={styles.modalBtnFechar}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {alertasSino.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CheckCircle size={32} color="#15803D" />
                <Text style={styles.emptyTitulo}>Você está em dia!</Text>
                <Text style={styles.emptyDesc}>
                  Nenhuma pauta pendente de votação ou escala não visualizada.
                </Text>
              </View>
            ) : (
              <FlatList
                data={alertasSino}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.notifCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalSinoAberto(false);
                      if (item.tipo === 'VOTACAO') {
                        setAbaAtiva('votacoes');
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.notifIconWrapper,
                        item.tipo === 'VOTACAO' && { backgroundColor: '#FFF7ED' },
                      ]}
                    >
                      {item.tipo === 'VOTACAO' ? (
                        <Vote size={16} color="#FF6B00" />
                      ) : (
                        <Calendar size={16} color="#2563EB" />
                      )}
                    </View>
                    <View style={styles.notifBody}>
                      <View style={styles.notifTopRow}>
                        <Text style={styles.notifTitulo}>{item.titulo}</Text>
                        <Text style={styles.notifHora}>{item.data}</Text>
                      </View>
                      <Text style={styles.notifMensagem}>{item.mensagem}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DETALHE DE ATA */}
      <Modal visible={Boolean(ataDetalheModal)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <FileText size={18} color="#FF6B00" />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {ataDetalheModal?.titulo}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAtaDetalheModal(null)}
                style={styles.modalBtnFechar}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {ataDetalheModal?.conteudoAta ? (
                <View style={styles.boxResumo}>
                  <Text style={styles.boxResumoTitulo}>Resumo da Pauta Geral:</Text>
                  <Text style={styles.boxResumoTexto}>{ataDetalheModal.conteudoAta}</Text>
                </View>
              ) : null}

              <Text style={styles.secaoModalTitulo}>
                Pautas ({ataDetalheModal?.pautas?.length || 0})
              </Text>

              {ataDetalheModal?.pautas && ataDetalheModal.pautas.length > 0 ? (
                ataDetalheModal.pautas.map((p) => (
                  <View key={p.id} style={styles.itemPautaModal}>
                    <View style={styles.itemPautaModalTopo}>
                      <Text style={styles.itemPautaModalTitulo}>{p.titulo}</Text>
                      <View style={styles.badgePautaModal}>
                        <Text style={styles.badgePautaModalTexto}>
                          {p.statusVotacao || 'CONCLUÍDA'}
                        </Text>
                      </View>
                    </View>
                    {p.descricao ? (
                      <Text style={styles.itemPautaModalDesc}>{p.descricao}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.semOpcoesTexto}>Nenhuma pauta registrada nesta ata.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  btnSino: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeSino: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeSinoTexto: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  tabButtonAtivo: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6B00',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 6,
  },
  tabTextAtivo: {
    color: '#FF6B00',
    fontWeight: '800',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  listaContent: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: '#F9FAFB',
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardItemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeOrigem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '65%',
  },
  badgeOrigemTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B00',
    marginLeft: 4,
  },
  badgeAberta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeAbertaTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    marginLeft: 4,
  },
  badgeVotado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeVotadoTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 4,
  },
  badgeEmAndamento: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeEmAndamentoTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  cardItemTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardItemDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 14,
  },
  linhaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  textoInfo: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  opcoesLista: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnOpcaoVoto: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  barraProgressoFundo: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  barraProgressoFundoEscolhida: {
    backgroundColor: '#FF6B00',
    opacity: 0.25,
  },
  btnOpcaoVotoAtiva: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  btnOpcaoVotoDesabilitada: {
    opacity: 0.85,
  },
  btnOpcaoVotoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
    zIndex: 1,
  },
  btnOpcaoVotoTextoAtivo: {
    color: '#FFFFFF',
  },
  btnOpcaoVotoTextoDesabilitada: {
    color: '#374151',
  },
  textoPorcentagem: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginRight: 8,
    zIndex: 1,
  },
  textoPorcentagemAtiva: {
    color: '#FFFFFF',
  },
  badgeQtdVotos: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeQtdVotosAtiva: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeQtdVotosTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  badgeQtdVotosTextoAtivo: {
    color: '#FFFFFF',
  },
  semOpcoesTexto: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  painelVotantesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  painelVotantesTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  painelVotantesContador: {
    fontSize: 10,
    color: '#FF6B00',
    fontWeight: '700',
    marginTop: 1,
  },
  painelVotantesIcon: {
    padding: 4,
  },
  secaoVotantesCorpo: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subTabsVotantes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  subTabBtnAtivo: {
    backgroundColor: '#E5E7EB',
  },
  subTabTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  subTabTextoAtivoVerde: {
    color: '#15803D',
  },
  subTabTextoAtivoLaranja: {
    color: '#D97706',
  },
  semListaTexto: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  linhaMembroVoto: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarMiniTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  membroInfoBox: {
    flex: 1,
  },
  membroNome: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  membroEscolha: {
    fontSize: 10,
    color: '#6B7280',
  },
  membroStatusPendente: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  btnVerDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnVerDetalhesTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalBtnFechar: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  notifCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifBody: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B00',
    textTransform: 'uppercase',
  },
  notifHora: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  notifMensagem: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  boxResumo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  boxResumoTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 4,
  },
  boxResumoTexto: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  secaoModalTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  itemPautaModal: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemPautaModalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemPautaModalTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  badgePautaModal: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgePautaModalTexto: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4B5563',
  },
  itemPautaModalDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
});
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Clock,
  Play,
  Pause,
  Video,
  FileText,
  ExternalLink,
  Music,
  Plus,
  Minus,
  ChevronDown,
} from 'lucide-react-native';

import {api} from '../../services/api';

export interface EscalaItem {
  id: number;
  data?: string;
  dataEscala?: string;
  dataCulto?: string;
  nomeCulto?: string;
  nomeCultoNoite?: string;
  nomeCultoManha?: string;
  evento?: string;
  departamentoNome?: string;
}

export interface EscalaMusicaResponseDTO {
  id: number;
  ordem?: number;
  musicaId?: number;
  nomeMusica?: string;
  cantor?: string;
  tom?: string;
  bpm?: number | string;
  cifra?: string;
  cifraUrl?: string;
  youtubeVideoId?: string;
}

export default function SalaEnsaioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const rotaEscalaId = route.params?.escalaId || route.params?.id;

  // Estados de Escala
  const [escalas, setEscalas] = useState<EscalaItem[]>([]);
  const [selectedEscalaId, setSelectedEscalaId] = useState<number | null>(
    rotaEscalaId ? Number(rotaEscalaId) : null
  );
  const [modalSeletorAberto, setModalSeletorAberto] = useState(false);

  // Estados de Músicas
  const [songs, setSongs] = useState<EscalaMusicaResponseDTO[]>([]);
  const [selectedSong, setSelectedSong] = useState<EscalaMusicaResponseDTO | null>(null);

  // Carregamentos e Erros
  const [loading, setLoading] = useState(true);
  const [loadingMusicas, setLoadingMusicas] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metrônomo
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(72);
  const beatsPerBar = 4;
  const [currentBeat, setCurrentBeat] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formata o rótulo da escala no formato DD/MM/AAAA - Nome
  const formatarRotuloEscala = (esc?: EscalaItem | null) => {
    if (!esc) return 'Selecione uma Escala';

    const dataBruta = esc.data || esc.dataEscala || esc.dataCulto;
    let dataFormatada = '';

    if (dataBruta) {
      const partes = String(dataBruta).split('T')[0].split('-');
      if (partes.length === 3) {
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      } else {
        dataFormatada = dataBruta;
      }
    }

    const nomeCulto =
      esc.nomeCulto ||
      esc.nomeCultoNoite ||
      esc.nomeCultoManha ||
      esc.evento ||
      esc.departamentoNome ||
      `Escala #${esc.id}`;

    return dataFormatada ? `${dataFormatada} - ${nomeCulto}` : `${nomeCulto} (#${esc.id})`;
  };

  // Sanitizador do YouTube idêntico ao da web
  const getYoutubeUrl = (song?: EscalaMusicaResponseDTO | null): string | null => {
    if (!song || !song.youtubeVideoId) return null;
    const raw = String(song.youtubeVideoId).trim();
    if (raw.includes('${') || raw.length < 5) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.includes('youtu.be/')) {
      const match = raw.split('youtu.be/')[1]?.split('?')[0];
      return match ? `https://www.youtube.com/watch?v=${match}` : null;
    }
    const cleanId = raw.replace(/[^a-zA-Z0-9_-]/g, '');
    return cleanId ? `https://www.youtube.com/watch?v=${cleanId}` : null;
  };

  // 1. Carrega todas as escalas
  const carregarEscalas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/escalas');
      const lista: EscalaItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.content || [];

      const ordenadas = [...lista].sort((a, b) => Number(b.id) - Number(a.id));
      setEscalas(ordenadas);

      if (rotaEscalaId) {
        setSelectedEscalaId(Number(rotaEscalaId));
      } else if (ordenadas.length > 0 && !selectedEscalaId) {
        setSelectedEscalaId(Number(ordenadas[0].id));
      } else if (ordenadas.length === 0) {
        setError('Nenhuma escala encontrada para a sua congregação.');
      }
    } catch (err: any) {
      console.error('Erro ao listar escalas:', err);
      setError('Não foi possível carregar as escalas da congregação.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rotaEscalaId, selectedEscalaId]);

  useEffect(() => {
    carregarEscalas();
  }, [carregarEscalas]);

  // 2. Carrega as músicas da escala selecionada
  const carregarMusicas = useCallback(async (escalaId: number) => {
    try {
      setLoadingMusicas(true);
      setError(null);

      const res = await api.get(`/escalas/${escalaId}/playlist-manual/musicas`);
      const lista: EscalaMusicaResponseDTO[] = Array.isArray(res.data) ? res.data : [];
      setSongs(lista);

      if (lista.length > 0) {
        setSelectedSong(lista[0]);
        setBpm(Number(lista[0].bpm) || 72);
      } else {
        setSelectedSong(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar repertório da escala:', err);
      setError('Não foi possível carregar o repertório desta escala.');
      setSongs([]);
      setSelectedSong(null);
    } finally {
      setLoadingMusicas(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEscalaId) {
      carregarMusicas(selectedEscalaId);
    }
  }, [selectedEscalaId, carregarMusicas]);

  // Troca de música e parada do metrônomo
  const selecionarMusica = (song: EscalaMusicaResponseDTO) => {
    setSelectedSong(song);
    setBpm(Number(song.bpm) || 72);
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  // Ciclo visual do Metrônomo
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = (60 / Math.max(30, bpm)) * 1000;
      timerRef.current = setInterval(() => {
        setCurrentBeat((prev) => (prev + 1) % beatsPerBar);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedEscalaId) {
      carregarMusicas(selectedEscalaId).finally(() => setRefreshing(false));
    } else {
      carregarEscalas();
    }
  };

  const abrirLink = async (url: string | null, tipo: string) => {
    if (!url) {
      Alert.alert('Indisponível', `Nenhum link de ${tipo} cadastrado.`);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', `Não foi possível abrir o link de ${tipo}.`);
    }
  };

  const escalaAtual = escalas.find((e) => e.id === selectedEscalaId);
  const youtubeUrl = getYoutubeUrl(selectedSong);

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
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeTexto}>SALA DE ENSAIO</Text>
          </View>
          <Text style={styles.headerTitulo}>Multitrack & Repertório</Text>
        </View>
      </View>

      {/* SELETOR DE ESCALA */}
      {escalas.length > 0 && (
        <View style={styles.seletorContainer}>
          <TouchableOpacity
            style={styles.seletorBotao}
            activeOpacity={0.8}
            onPress={() => setModalSeletorAberto(!modalSeletorAberto)}
          >
            <Calendar size={16} color="#FF6B00" />
            <Text style={styles.seletorTexto} numberOfLines={1}>
              {formatarRotuloEscala(escalaAtual)}
            </Text>
            <ChevronDown size={16} color="#4B5563" />
          </TouchableOpacity>

          {/* LISTA EXPANSÍVEL DE ESCALAS */}
          {modalSeletorAberto && (
            <View style={styles.menuEscalas}>
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {escalas.map((esc) => (
                  <TouchableOpacity
                    key={esc.id}
                    style={[
                      styles.opcaoEscala,
                      selectedEscalaId === esc.id && styles.opcaoEscalaAtiva,
                    ]}
                    onPress={() => {
                      setSelectedEscalaId(esc.id);
                      setModalSeletorAberto(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.opcaoEscalaTexto,
                        selectedEscalaId === esc.id && styles.opcaoEscalaTextoAtivo,
                      ]}
                      numberOfLines={1}
                    >
                      {formatarRotuloEscala(esc)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.feedbackTexto}>Carregando sala de ensaio...</Text>
          </View>
        ) : loadingMusicas ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.feedbackTexto}>Carregando repertório da escala...</Text>
          </View>
        ) : error || songs.length === 0 ? (
          <View style={styles.vazioCard}>
            <View style={styles.vazioIcone}>
              <Music size={26} color="#FF6B00" />
            </View>
            <Text style={styles.vazioTitulo}>Nenhuma música vinculada</Text>
            <Text style={styles.vazioSub}>
              {error || 'Esta escala ainda não possui músicas cadastradas para ensaio.'}
            </Text>
          </View>
        ) : (
          <>
            {/* PAINEL DA MÚSICA SELECIONADA */}
            {selectedSong && (
              <View style={styles.cardPlayer}>
                <View style={styles.playerTopo}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.playerLabel}>EM REPRODUÇÃO</Text>
                    <Text style={styles.playerTitulo} numberOfLines={2}>
                      {selectedSong.nomeMusica}
                    </Text>
                    <Text style={styles.playerCantor} numberOfLines={1}>
                      Ministrado por: {selectedSong.cantor || 'Equipe'}
                    </Text>
                  </View>

                  <View style={styles.tagsContainer}>
                    <View style={styles.tagTom}>
                      <Text style={styles.tagTomLabel}>TOM</Text>
                      <Text style={styles.tagTomValor}>{selectedSong.tom || 'N/A'}</Text>
                    </View>
                    <View style={styles.tagBpm}>
                      <Text style={styles.tagBpmLabel}>BPM</Text>
                      <Text style={styles.tagBpmValor}>{bpm}</Text>
                    </View>
                  </View>
                </View>

                {/* VÍDEO DO YOUTUBE */}
                {youtubeUrl ? (
                  <TouchableOpacity
                    style={styles.cardYoutube}
                    activeOpacity={0.8}
                    onPress={() => abrirLink(youtubeUrl, 'YouTube')}
                  >
                    <View style={styles.iconeVideoContainer}>
                      <Video size={18} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.youtubeTitulo}>Vídeo de Referência Oficial</Text>
                      <Text style={styles.youtubeSub}>Toque para abrir no app/navegador</Text>
                    </View>
                    <ExternalLink size={14} color="#DC2626" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.cardSemVideo}>
                    <Video size={16} color="#9CA3AF" />
                    <Text style={styles.semVideoTexto}>
                      Nenhum vídeo vinculado a esta música.
                    </Text>
                  </View>
                )}

                {/* METRÔNOMO */}
                <View style={styles.metronomoContainer}>
                  <View style={styles.metronomoTopo}>
                    <View style={styles.metronomoTituloRow}>
                      <Clock size={16} color="#FF6B00" />
                      <Text style={styles.metronomoTitulo}>Metrônomo do Ensaio</Text>
                    </View>

                    {/* BEATS VISUAIS */}
                    <View style={styles.beatsRow}>
                      {Array.from({ length: beatsPerBar }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.beatDot,
                            isPlaying && currentBeat === idx && (
                              idx === 0 ? styles.beatDotPrimeiro : styles.beatDotAtivo
                            ),
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.metronomoControles}>
                    <TouchableOpacity
                      style={[
                        styles.btnClick,
                        isPlaying ? styles.btnClickParar : styles.btnClickIniciar,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause size={16} color="#FFFFFF" />
                      ) : (
                        <Play size={16} color="#FFFFFF" />
                      )}
                      <Text style={styles.btnClickTexto}>
                        {isPlaying ? 'Parar Click' : 'Iniciar Click'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.ajusteBpmRow}>
                      <TouchableOpacity
                        style={styles.btnBpmAjuste}
                        onPress={() => setBpm((b) => Math.max(30, b - 5))}
                      >
                        <Text style={styles.btnBpmTexto}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnBpmAjuste}
                        onPress={() => setBpm((b) => Math.max(30, b - 1))}
                      >
                        <Minus size={14} color="#1F2937" />
                      </TouchableOpacity>

                      <View style={styles.displayBpm}>
                        <Text style={styles.displayBpmNumero}>{bpm}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.btnBpmAjuste}
                        onPress={() => setBpm((b) => Math.min(260, b + 1))}
                      >
                        <Plus size={14} color="#1F2937" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnBpmAjuste}
                        onPress={() => setBpm((b) => Math.min(260, b + 5))}
                      >
                        <Text style={styles.btnBpmTexto}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* CIFRA / ARRANJO */}
                {selectedSong.cifra ? (
                  <View style={styles.cifraContainer}>
                    <View style={styles.cifraTopo}>
                      <View style={styles.cifraTituloRow}>
                        <FileText size={16} color="#FF6B00" />
                        <Text style={styles.cifraTitulo}>Cifra & Arranjo</Text>
                      </View>
                      {selectedSong.cifraUrl && (
                        <TouchableOpacity
                          style={styles.cifraLinkExterna}
                          onPress={() => abrirLink(selectedSong.cifraUrl || null, 'Cifra Externa')}
                        >
                          <Text style={styles.cifraLinkTexto}>Externa</Text>
                          <ExternalLink size={12} color="#FF6B00" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      style={styles.cifraScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      <Text style={styles.cifraTexto}>{selectedSong.cifra}</Text>
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            )}

            {/* LISTA DA ORDEM DO REPERTÓRIO */}
            <View style={styles.secaoOrdem}>
              <View style={styles.secaoOrdemHeader}>
                <View style={styles.secaoOrdemTituloRow}>
                  <Layers size={16} color="#FF6B00" />
                  <Text style={styles.secaoOrdemTitulo}>Ordem do Repertório</Text>
                </View>
                <Text style={styles.secaoOrdemTotal}>{songs.length} faixas</Text>
              </View>

              <View style={styles.listaFaixas}>
                {songs.map((song, idx) => {
                  const ativa = selectedSong?.id === song.id;

                  return (
                    <TouchableOpacity
                      key={song.id || idx}
                      style={[styles.cardFaixa, ativa && styles.cardFaixaAtiva]}
                      activeOpacity={0.7}
                      onPress={() => selecionarMusica(song)}
                    >
                      <View style={styles.faixaEsquerda}>
                        <View style={[styles.faixaIndice, ativa && styles.faixaIndiceAtiva]}>
                          <Text style={[styles.faixaIndiceTexto, ativa && styles.faixaIndiceTextoAtivo]}>
                            #{song.ordem || idx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.faixaNome, ativa && styles.faixaNomeAtivo]}
                            numberOfLines={1}
                          >
                            {song.nomeMusica}
                          </Text>
                          <Text style={styles.faixaCantor} numberOfLines={1}>
                            {song.cantor || 'Equipe'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.faixaDireita}>
                        <View style={styles.faixaBadgeTom}>
                          <Text style={styles.faixaBadgeTomTexto}>{song.tom || 'N/D'}</Text>
                        </View>
                        {song.bpm ? (
                          <Text style={styles.faixaBpmTexto}>{song.bpm} BPM</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B00',
  },
  headerBadgeTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 1,
  },
  seletorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  seletorBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  seletorTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuEscalas: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 6,
  },
  opcaoEscala: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  opcaoEscalaAtiva: {
    backgroundColor: '#FFF7ED',
  },
  opcaoEscalaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  opcaoEscalaTextoAtivo: {
    color: '#FF6B00',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  feedbackTexto: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  vazioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  vazioIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  vazioSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  cardPlayer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  playerTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  playerTitulo: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 2,
  },
  playerCantor: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tagTom: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 42,
  },
  tagTomLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#C2410C',
  },
  tagTomValor: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EA580C',
  },
  tagBpm: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 42,
  },
  tagBpmLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6B7280',
  },
  tagBpmValor: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1F2937',
  },
  cardYoutube: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  iconeVideoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youtubeTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  youtubeSub: {
    fontSize: 10,
    color: '#B91C1C',
  },
  cardSemVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  semVideoTexto: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metronomoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  metronomoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metronomoTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metronomoTitulo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  beatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  beatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  beatDotPrimeiro: {
    backgroundColor: '#FF6B00',
    transform: [{ scale: 1.25 }],
  },
  beatDotAtivo: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 1.15 }],
  },
  metronomoControles: {
    flexDirection: 'column',
    gap: 10,
  },
  btnClick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnClickIniciar: {
    backgroundColor: '#FF6B00',
  },
  btnClickParar: {
    backgroundColor: '#DC2626',
  },
  btnClickTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ajusteBpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnBpmAjuste: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBpmTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  displayBpm: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayBpmNumero: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1F2937',
  },
  cifraContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  cifraTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cifraTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cifraTitulo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  cifraLinkExterna: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cifraLinkTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B00',
  },
  cifraScroll: {
    maxHeight: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cifraTexto: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#1F2937',
    lineHeight: 16,
  },
  secaoOrdem: {
    gap: 8,
  },
  secaoOrdemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  secaoOrdemTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secaoOrdemTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textTransform: 'uppercase',
  },
  secaoOrdemTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  listaFaixas: {
    gap: 8,
  },
  cardFaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  cardFaixaAtiva: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF8F2',
  },
  faixaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  faixaIndice: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faixaIndiceAtiva: {
    backgroundColor: '#FF6B00',
  },
  faixaIndiceTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  faixaIndiceTextoAtivo: {
    color: '#FFFFFF',
  },
  faixaNome: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  faixaNomeAtivo: {
    color: '#FF6B00',
  },
  faixaCantor: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  faixaDireita: {
    alignItems: 'flex-end',
    gap: 2,
  },
  faixaBadgeTom: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  faixaBadgeTomTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
  },
  faixaBpmTexto: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});
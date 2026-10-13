import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { Bell, UserCheck, Clock, Vote, Calendar, Check, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from '../../services/api';
import { ataService } from '../../services/ataService';
import { isVotacaoExpirada } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';

interface NotificacaoAta {
  id: string;
  ataId: number;
  tipo: 'VOTACAO' | 'REUNIAO';
  titulo: string;
  mensagem: string;
  data: string;
}

interface UsuarioPendente {
  id: number;
  nome: string;
  email: string;
}

const STORAGE_KEY_LIDAS = '@hope_mobile_atas_lidas';

export function NotificacoesHeaderMobile() {
  const [modalAberto, setModalAberto] = useState(false);
  const [pendentesUsuarios, setPendentesUsuarios] = useState<UsuarioPendente[]>([]);
  const [notificacoesAtas, setNotificacoesAtas] = useState<NotificacaoAta[]>([]);
  const [lidasAtas, setLidasAtas] = useState<string[]>([]);

  const authContext = useAuth() as any;
  // Dá suporte tanto a 'usuario' quanto a 'user' sem quebrar tipagem
  const usuario = authContext.usuario || authContext.user || null;

  const navigation = useNavigation<any>();
  const totalAnteriorRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_LIDAS);
        if (raw) setLidasAtas(JSON.parse(raw));
      } catch (err) {
        console.warn('Erro ao ler lidas:', err);
      }
    })();
  }, []);

  const dispararAlertaNotificacao = () => {
    try {
      Vibration.vibrate([0, 80, 60, 80]);
    } catch {
      // Ignora em dispositivos sem vibração
    }
  };

  const carregarDados = async () => {
    let qtdUsuarios = 0;
    let qtdAtasNaoLidas = 0;

    // 1. Usuários pendentes
    try {
      const resp = await api.get('/usuarios/pendentes');
      const listaUsers = resp.data || [];
      setPendentesUsuarios(listaUsers);
      qtdUsuarios = listaUsers.length;
    } catch {
      // Endpoint restrito
    }

    // 2. Atas e Votações
    try {
      const atas = await ataService.listar();
      if (Array.isArray(atas)) {
        const lista: NotificacaoAta[] = [];

        atas.forEach((ata: any) => {
          const expirada = isVotacaoExpirada(ata.dataReuniao);
          if (ata.status === 'CONCLUIDA' || expirada) return;

          const pautasComVoto = ata.pautas?.filter((p: any) => p.requerVotacao) || [];
          const naoVotadas = pautasComVoto.filter((p: any) => {
            if (!usuario?.id) return true;
            return !p.votos?.some((v: any) => v.usuarioId === usuario.id);
          });

          if (naoVotadas.length > 0) {
            lista.push({
              id: `ata-${ata.id}-votacao`,
              ataId: ata.id,
              tipo: 'VOTACAO',
              titulo: 'Votação Aberta',
              mensagem: `${naoVotadas.length} pauta(s) aguardando voto em "${ata.titulo}".`,
              data: ata.dataReuniao,
            });
          } else if (pautasComVoto.length === 0) {
            lista.push({
              id: `ata-${ata.id}-reuniao`,
              ataId: ata.id,
              tipo: 'REUNIAO',
              titulo: 'Reunião Agendada',
              mensagem: `Ata "${ata.titulo}" disponível para conferência.`,
              data: ata.dataReuniao,
            });
          }
        });

        setNotificacoesAtas(lista);
        qtdAtasNaoLidas = lista.filter((n) => !lidasAtas.includes(n.id)).length;
      }
    } catch (err) {
      console.warn('Erro ao carregar atas:', err);
    }

    const totalAtual = qtdUsuarios + qtdAtasNaoLidas;
    if (totalAtual > totalAnteriorRef.current && totalAnteriorRef.current !== 0) {
      dispararAlertaNotificacao();
    }
    totalAnteriorRef.current = totalAtual;
  };

  useEffect(() => {
    carregarDados();
    const timer = setInterval(carregarDados, 60000);
    return () => clearInterval(timer);
  }, [usuario?.id, lidasAtas]);

  const atasNaoLidas = notificacoesAtas.filter((item) => !lidasAtas.includes(item.id));
  const totalBadge = pendentesUsuarios.length + atasNaoLidas.length;

  const marcarComoLida = async (notif: NotificacaoAta) => {
    const novasLidas = Array.from(new Set([...lidasAtas, notif.id]));
    setLidasAtas(novasLidas);
    await AsyncStorage.setItem(STORAGE_KEY_LIDAS, JSON.stringify(novasLidas));
    setModalAberto(false);
    navigation.navigate('AtasVotacoesScreen', { ataId: notif.ataId });
  };

  const marcarTodasLidas = async () => {
    const todosIds = notificacoesAtas.map((n) => n.id);
    const novasLidas = Array.from(new Set([...lidasAtas, ...todosIds]));
    setLidasAtas(novasLidas);
    await AsyncStorage.setItem(STORAGE_KEY_LIDAS, JSON.stringify(novasLidas));
  };

  const handleIrAprovacao = () => {
    setModalAberto(false);
    navigation.navigate('UsuariosPendentesScreen');
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.botaoSino}
        onPress={() => setModalAberto(true)}
        activeOpacity={0.7}
      >
        <Bell size={22} color="#CBD5E1" />
        {totalBadge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>
              {totalBadge > 9 ? '9+' : totalBadge}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalAberto}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.tituloRow}>
                <Clock size={18} color="#FF6B00" />
                <Text style={styles.modalTitulo}>Notificações</Text>
                {totalBadge > 0 && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeTexto}>{totalBadge}</Text>
                  </View>
                )}
              </View>

              <View style={styles.acoesHeader}>
                {atasNaoLidas.length > 0 && (
                  <TouchableOpacity
                    style={styles.btnMarcarTodas}
                    onPress={marcarTodasLidas}
                  >
                    <Check size={14} color="#94A3B8" />
                    <Text style={styles.btnMarcarTodasTexto}>Lidas</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.btnFechar}
                  onPress={() => setModalAberto(false)}
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {totalBadge === 0 && notificacoesAtas.length === 0 ? (
              <View style={styles.vazioContainer}>
                <Text style={styles.vazioTexto}>
                  Nenhuma notificação no momento.
                </Text>
              </View>
            ) : (
              <FlatList
                data={[
                  ...pendentesUsuarios.map((u) => ({ ...u, tipoOrigem: 'USER' as const })),
                  ...notificacoesAtas.map((a) => ({ ...a, tipoOrigem: 'ATA' as const })),
                ]}
                keyExtractor={(item: any) =>
                  item.tipoOrigem === 'USER' ? `user-${item.id}` : item.id
                }
                contentContainerStyle={styles.listaContainer}
                renderItem={({ item }: { item: any }) => {
                  if (item.tipoOrigem === 'USER') {
                    return (
                      <View style={styles.cardItem}>
                        <View style={styles.cardIconBox}>
                          <UserCheck size={18} color="#FF6B00" />
                        </View>
                        <View style={styles.cardInfo}>
                          <View style={styles.tagUsuarioRow}>
                            <Text style={styles.tagAcesso}>CADASTRO</Text>
                            <Text style={styles.cardNome} numberOfLines={1}>
                              {item.nome}
                            </Text>
                          </View>
                          <Text style={styles.cardSubtexto} numberOfLines={1}>
                            {item.email}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.btnAcaoUser}
                          onPress={handleIrAprovacao}
                        >
                          <Text style={styles.btnAcaoUserTexto}>Liberar</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  const jaLida = lidasAtas.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.cardItem,
                        jaLida && styles.cardItemLido,
                      ]}
                      onPress={() => marcarComoLida(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardIconBox}>
                        {item.tipo === 'VOTACAO' ? (
                          <Vote size={18} color="#FF6B00" />
                        ) : (
                          <Calendar size={18} color="#3B82F6" />
                        )}
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={styles.rowTituloCard}>
                          <Text style={styles.cardTituloAta} numberOfLines={1}>
                            {item.titulo}
                          </Text>
                          {!jaLida && <View style={styles.pontoNaoLido} />}
                        </View>
                        <Text style={styles.cardDescricaoAta}>
                          {item.mensagem}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  botaoSino: {
    padding: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B00',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitulo: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagBadgeTexto: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
  },
  acoesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnMarcarTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnMarcarTodasTexto: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  btnFechar: {
    padding: 4,
  },
  listaContainer: {
    padding: 16,
    gap: 10,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  cardItemLido: {
    opacity: 0.5,
    backgroundColor: '#0F172A',
  },
  cardIconBox: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
  },
  tagUsuarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tagAcesso: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    color: '#FF6B00',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cardNome: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardSubtexto: {
    color: '#94A3B8',
    fontSize: 11,
  },
  btnAcaoUser: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnAcaoUserTexto: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
  },
  rowTituloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTituloAta: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  pontoNaoLido: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B00',
  },
  cardDescricaoAta: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  vazioContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTexto: {
    color: '#64748B',
    fontSize: 13,
  },
});
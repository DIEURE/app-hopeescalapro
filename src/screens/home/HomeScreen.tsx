import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  CalendarDays,
  Music,
  Clock,
  Users,
  Vote,
  User,
  Bell,
  Settings,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  LucideIcon,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import {api} from '../../services/api';
 

interface ProximaEscala {
  id: number;
  escalaId: number;
  data: string;
  horario: string;
  funcao: string;
  evento: string;
  local?: string;
  confirmado: boolean;
}

interface PautaAviso {
  id: number;
  ataId: number;
  titulo: string;
  descricao: string;
  status: string;
  dataAta: string;
}

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeBg: string;
  badgeTextColor: string;
  iconBg: string;
  iconColor: string;
  route: string;
}

function extrairDataFormatada(item: any): { dataStr: string; dataFormatadaBR: string } | null {
  const bruta = item.dataEscala || item.data || item?.escala?.dataEscala || item?.escala?.data;
  if (!bruta) return null;

  let ano = 0;
  let mes = '';
  let dia = '';

  if (Array.isArray(bruta) && bruta.length >= 3) {
    ano = bruta[0];
    mes = String(bruta[1]).padStart(2, '0');
    dia = String(bruta[2]).padStart(2, '0');
  } else if (typeof bruta === 'string') {
    const partes = bruta.substring(0, 10).split('-');
    if (partes.length === 3) {
      ano = Number(partes[0]);
      mes = partes[1].padStart(2, '0');
      dia = partes[2].padStart(2, '0');
    }
  }

  if (!ano || !mes || !dia) return null;

  return {
    dataStr: `${ano}-${mes}-${dia}`,
    dataFormatadaBR: `${dia}/${mes}/${ano}`,
  };
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proximaEscala, setProximaEscala] = useState<ProximaEscala | null>(null);
  const [avisosPautas, setAvisosPautas] = useState<PautaAviso[]>([]);
  const [totalVotacoesAtivas, setTotalVotacoesAtivas] = useState(0);

  const carregarDadosHome = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await api.get('/escala-musicos/minhas-escalas');
      const dados = Array.isArray(response.data) ? response.data : [];

      const hoje = new Date();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      const validas = dados
        .map((item: any, idx: number) => {
          const infoData = extrairDataFormatada(item);
          if (!infoData) return null;

          let statusNormalizado = 'PENDENTE';
          if (item.confirmado === true || item.status === 'CONFIRMADO') {
            statusNormalizado = 'CONFIRMADO';
          } else if (item.confirmado === false || item.status === 'RECUSADO') {
            statusNormalizado = 'RECUSADO';
          }

          const tipoCultoFinal =
            item.tipoCulto ||
            item?.escala?.tipoCulto ||
            (item.horarioManha || item.periodo === 'MANHA' ? 'MANHA' : 'NOITE');

          const horarioResolvido =
            item.horario ||
            item.hora ||
            item?.escala?.horario ||
            (tipoCultoFinal === 'MANHA'
              ? item.horarioManha || '09:00'
              : item.horarioNoite || '19:00');

          const eventoResolvido =
            item.nomeCulto ||
            item.culto ||
            item?.escala?.nomeCulto ||
            item?.escala?.nome ||
            (tipoCultoFinal === 'MANHA' ? 'Culto Matutino' : 'Culto de Celebração');

          return {
            id: item.id ?? idx,
            escalaId: item.escalaId ?? item?.escala?.id ?? item.id ?? idx,
            dataStr: infoData.dataStr,
            dataBR: infoData.dataFormatadaBR,
            horario: String(horarioResolvido).substring(0, 5),
            funcao: item.instrumentoOuFuncao || item.instrumento || item.funcao || 'Músico',
            evento: eventoResolvido,
            local: item.local || 'Templo Principal',
            status: statusNormalizado,
            confirmado: statusNormalizado === 'CONFIRMADO',
          };
        })
        .filter((item): item is NonNullable<typeof item> => {
          if (!item) return false;
          return item.status !== 'RECUSADO' && item.dataStr >= hojeStr;
        })
        .sort((a, b) => a.dataStr.localeCompare(b.dataStr));

      if (validas.length > 0) {
        const prox = validas[0];
        setProximaEscala({
          id: prox.id,
          escalaId: prox.escalaId,
          data: prox.dataBR,
          horario: prox.horario,
          funcao: prox.funcao,
          evento: prox.evento,
          local: prox.local,
          confirmado: prox.confirmado,
        });
      } else {
        setProximaEscala(null);
      }
    } catch {
      setProximaEscala(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarPautasAtivas = useCallback(async () => {
    try {
      // Chama direto a instância api já importada na tela
      const resAtas = await api.get('/atas');
      const listaAtas = Array.isArray(resAtas.data) ? resAtas.data : (resAtas.data?.content || []);

      console.log('== RESPOSTA BRUTA DE ATAS ==', JSON.stringify(listaAtas, null, 2));

      let todasPautas: any[] = [];

      const jaPossuiPautas = listaAtas.some((a: any) =>
        (Array.isArray(a.pautas) && a.pautas.length > 0) ||
        (Array.isArray(a.pautaList) && a.pautaList.length > 0)
      );

      if (jaPossuiPautas) {
        listaAtas.forEach((ata: any) => {
          const pautas = ata.pautas || ata.pautaList || [];
          pautas.forEach((p: any) => {
            todasPautas.push({
              ...p,
              ataId: ata.id,
              ataTitulo: ata.titulo,
              dataAta: ata.data || ata.dataReuniao,
            });
          });
        });
      } else if (listaAtas.length > 0) {
        const detalhesAtas = await Promise.all(
          listaAtas.slice(0, 5).map(async (ata: any) => {
            try {
              const res = await api.get(`/atas/${ata.id}`);
              return res.data;
            } catch {
              return ata;
            }
          })
        );

        detalhesAtas.forEach((ata: any) => {
          const pautas = ata.pautas || ata.pautaList || [];
          pautas.forEach((p: any) => {
            todasPautas.push({
              ...p,
              ataId: ata.id,
              ataTitulo: ata.titulo,
              dataAta: ata.data || ata.dataReuniao,
            });
          });
        });
      }

      console.log('== TODAS AS PAUTAS EXTRAÍDAS ==', JSON.stringify(todasPautas, null, 2));

      const pautasFiltradas: PautaAviso[] = todasPautas
        .filter((p: any) => {
          const st = String(p.status || p.statusVotacao || '').toUpperCase();
          return (
            st.includes('VOTA') ||
            st.includes('ABERT') ||
            st.includes('ANDAMENTO') ||
            p.votacaoAberta === true
          );
        })
        .map((pauta: any) => {
          const infoDataAta = extrairDataFormatada({ data: pauta.dataAta || pauta.dataCriacao });
          return {
            id: pauta.id,
            ataId: pauta.ataId,
            titulo: pauta.titulo || pauta.assunto || 'Pauta em Votação',
            descricao: pauta.descricao || pauta.texto || 'Decisão em andamento para os membros da equipe.',
            status: pauta.status || 'EM_VOTACAO',
            dataAta: infoDataAta ? infoDataAta.dataFormatadaBR : 'Ativa',
          };
        });

      console.log('== PAUTAS FILTRADAS FINAL ==', pautasFiltradas);

      setAvisosPautas(pautasFiltradas);
      setTotalVotacoesAtivas(pautasFiltradas.length);
    } catch (err) {
      console.error('Erro ao carregar pautas na Home:', err);
      setAvisosPautas([]);
      setTotalVotacoesAtivas(0);
    }
  }, []);


  const carregarTudo = useCallback(async () => {
    await Promise.all([carregarDadosHome(), carregarPautasAtivas()]);
  }, [carregarDadosHome, carregarPautasAtivas]);

  useFocusEffect(
    useCallback(() => {
      carregarTudo();
    }, [carregarTudo])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarTudo().finally(() => setRefreshing(false));
  };

  const nomeCompleto = usuario?.nome || 'Músico';
  const primeiroNome = nomeCompleto.split(' ')[0];
  const iniciais = nomeCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const menuOptions: MenuOption[] = [
    {
      id: '1',
      title: 'Escalas',
      description: 'Seus dias e ministérios',
      icon: CalendarDays,
      badge: proximaEscala ? (!proximaEscala.confirmado ? 'Pendente' : undefined) : undefined,
      badgeBg: '#06c219',
      badgeTextColor: '#B45309',
      iconBg: '#FFF7ED',
      iconColor: '#FF6B00',
      route: 'Escalas',
    },
    {
      id: '2',
      title: 'Playlist',
      description: 'Repertório e cifras',
      icon: Music,
      badgeBg: '#DCFCE7',
      badgeTextColor: '#15803D',
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      route: 'Repertorio',
    },
    {
      id: '3',
      title: 'Disponibilidade',
      description: 'Avise quando pode servir',
      icon: Clock,
      badgeBg: '#FEF3C7',
      badgeTextColor: '#B45309',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      route: 'Disponibilidade',
    },
    {
      id: '4',
      title: 'Ensaios',
      description: 'Cronograma de treinos',
      icon: Users,
      badgeBg: '#F3E8FF',
      badgeTextColor: '#7E22CE',
      iconBg: '#FAF5FF',
      iconColor: '#9333EA',
      route: 'SalaEnsaio',
    },
    {
      id: '5',
      title: 'Votações',
      description: 'Decisões da equipe',
      icon: Vote,
      badge: totalVotacoesAtivas > 0 ? `${totalVotacoesAtivas} ativa` : undefined,
      badgeBg: '#FFE4E6',
      badgeTextColor: '#E11D48',
      iconBg: '#FFF1F2',
      iconColor: '#E11D48',
      route: 'AtasVotacoes',
    },
    {
      id: '6',
      title: 'Meu Perfil',
      description: 'Dados e ministérios',
      icon: User,
      badgeBg: '#DBEAFE',
      badgeTextColor: '#1D4ED8',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      route: 'Perfil',
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER COM AVATAR E BOTÕES DE AÇÃO */}
      <View style={styles.header}>
        <View style={styles.headerUsuario}>
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.avatarTexto}>{iniciais}</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.subSaudacao}>Olá, {primeiroNome}</Text>
            <Text style={styles.saudacao}>Painel Geral</Text>
          </View>
        </View>

        <View style={styles.headerAcoes}>
          <TouchableOpacity
            style={styles.iconeBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AtasVotacoes')}
          >
            <Bell size={19} color="#374151" />
            {totalVotacoesAtivas > 0 && <View style={styles.pontoAlerta} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconeBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Settings size={19} color="#374151" />
          </TouchableOpacity>
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
            colors={['#FF6B00']}
          />
        }
      >
        {/* BANNER DE PRÓXIMO COMPROMISSO */}
        {carregando && !refreshing ? (
          <View style={styles.bannerLoading}>
            <ActivityIndicator color="#FF6B00" />
          </View>
        ) : proximaEscala ? (
          <TouchableOpacity
            style={styles.bannerDestaque}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SalaEnsaio', { escalaId: proximaEscala.escalaId })}
          >
            <View style={styles.bannerTopo}>
              <View style={styles.badgeBanner}>
                <Sparkles size={12} color="#f8f8f8" />
                <Text style={styles.badgeBannerTexto}>PRÓXIMO COMPROMISSO</Text>
              </View>

              {proximaEscala.confirmado ? (
                <View style={styles.statusConfirmadoBadge}>
                  <CheckCircle2 size={11} color="#15803D" />
                  <Text style={styles.statusConfirmadoTexto}>Confirmado</Text>
                </View>
              ) : (
                <View style={styles.statusPendenteBadge}>
                  <AlertCircle size={11} color="#B45309" />
                  <Text style={styles.statusPendenteTexto}>Pendente</Text>
                </View>
              )}
            </View>

            <Text style={styles.bannerTitulo} numberOfLines={1}>
              {proximaEscala.evento}
            </Text>

            <Text style={styles.bannerFuncao}>
              Função: {proximaEscala.funcao}
            </Text>

            <View style={styles.bannerRodape}>
              <View style={styles.bannerInfoItem}>
                <Clock size={13} color="#ffd6d6" />
                <Text style={styles.bannerInfoTexto}>
                  {proximaEscala.data} às {proximaEscala.horario}
                </Text>
              </View>

              {proximaEscala.local && (
                <View style={styles.bannerInfoItem}>
                  <MapPin size={13} color="#FFE7D6" />
                  <Text style={styles.bannerInfoTexto}>{proximaEscala.local}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.bannerVazio}>
            <CalendarDays size={26} color="#9CA3AF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerVazioTitulo}>Nenhum compromisso próximo</Text>
              <Text style={styles.bannerVazioDescricao}>
                Você não possui escalas ativas agendadas para os próximos dias.
              </Text>
            </View>
          </View>
        )}

        {/* MURAL DE AVISOS / PAUTAS EM VOTAÇÃO */}
        {avisosPautas.length > 0 && (
          <View style={styles.secaoAvisos}>
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Mural de Decisões</Text>
              <View style={styles.avisoContador}>
                <Text style={styles.avisoContadorTexto}>
                  {avisosPautas.length} {avisosPautas.length === 1 ? 'em votação' : 'em votação'}
                </Text>
              </View>
            </View>

            {avisosPautas.map((pauta) => (
              <TouchableOpacity
                key={pauta.id}
                style={styles.cardAviso}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AtasVotacoes')}
              >
                <View style={styles.avisoIconeContainer}>
                  <Megaphone size={16} color="#FF6B00" />
                </View>
                <View style={styles.avisoCorpo}>
                  <View style={styles.avisoLinhaTopo}>
                    <Text style={styles.avisoTitulo} numberOfLines={1}>
                      {pauta.titulo}
                    </Text>
                    <Text style={styles.avisoData}>{pauta.dataAta}</Text>
                  </View>
                  <Text style={styles.avisoTexto} numberOfLines={2}>
                    {pauta.descricao}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* RECURSOS DO APP */}
        <Text style={styles.secaoTitulo}>Recursos do App</Text>

        <View style={styles.grid}>
          {menuOptions.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.cardItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={styles.cardItemTopo}>
                  <View style={[styles.iconeContainer, { backgroundColor: item.iconBg }]}>
                    <IconComp size={22} color={item.iconColor} />
                  </View>

                  {item.badge && (
                    <View style={[styles.cardBadge, { backgroundColor: item.badgeBg }]}>
                      <Text style={[styles.cardBadgeTexto, { color: item.badgeTextColor }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardItemTextos}>
                  <Text style={styles.cardItemTitulo} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardItemDescricao} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5EB',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  subSaudacao: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  saudacao: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 1,
  },
  headerAcoes: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pontoAlerta: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  bannerLoading: {
    height: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  bannerDestaque: {
    backgroundColor: '#FF6B00',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeBannerTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFE0C2',
    letterSpacing: 0.6,
  },
  statusConfirmadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusConfirmadoTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPendenteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPendenteTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  bannerTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  bannerFuncao: {
    fontSize: 13,
    color: '#FFF2E8',
    marginTop: 2,
    marginBottom: 10,
    fontWeight: '500',
  },
  bannerRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  bannerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerInfoTexto: {
    fontSize: 12,
    color: '#FFE7D6',
    fontWeight: '600',
  },
  bannerVazio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 20,
  },
  bannerVazioTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  bannerVazioDescricao: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  secaoAvisos: {
    marginBottom: 20,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avisoContador: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  avisoContadorTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
  cardAviso: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avisoIconeContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avisoCorpo: {
    flex: 1,
  },
  avisoLinhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  avisoTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  avisoData: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  avisoTexto: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  secaoTitulo: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardItem: {
    width: '48%',
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardItemTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconeContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardBadgeTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardItemTextos: {
    marginTop: 4,
  },
  cardItemTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardItemDescricao: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
});
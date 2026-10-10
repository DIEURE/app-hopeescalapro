import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Music2,
  Trash2,
  Play,
  ExternalLink,
  BookOpen,
  Plus,
} from 'lucide-react-native';

import {api} from '../../services/api';

export interface EscalaPlaylist {
  id: number;
  dataEscala?: string;
  data?: string;
  culto?: string;
  nomeCultoNoite?: string;
  nomeCultoManha?: string;
  evento?: string;
  nomeDepartamento?: string;
  departamento?: { nome?: string };
  youtubePlaylistUrl?: string;
  linkPlaylistManual?: string;
}

export default function RepertorioScreen() {
  const navigation = useNavigation<any>();

  const [escalas, setEscalas] = useState<EscalaPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formata data padrão brasileiro (DD/MM/AAAA)
  const formatarData = (dataString?: string) => {
    if (!dataString) return '—';
    const partes = String(dataString).split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataString;
  };

  // Carrega escalas e filtra as que possuem playlist cadastrada
  const carregarEscalasComPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/escalas');
      const lista: EscalaPlaylist[] = Array.isArray(res.data)
        ? res.data
        : res.data?.content || [];

      const comPlaylist = lista.filter(
        (e) =>
          (e.youtubePlaylistUrl && e.youtubePlaylistUrl.trim() !== '') ||
          (e.linkPlaylistManual && e.linkPlaylistManual.trim() !== '')
      );

      const ordenadas = comPlaylist.sort((a, b) => {
        const dataA = new Date(a.dataEscala || a.data || '').getTime() || 0;
        const dataB = new Date(b.dataEscala || b.data || '').getTime() || 0;
        return dataB - dataA;
      });

      setEscalas(ordenadas);
    } catch (error) {
      console.error('Erro ao carregar playlists:', error);
      Alert.alert('Erro', 'Não foi possível carregar as playlists das escalas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarEscalasComPlaylist();
  }, [carregarEscalasComPlaylist]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarEscalasComPlaylist();
  };

  const abrirLinkPlaylist = async (urlBruta?: string) => {
    if (!urlBruta) return;
    const urlFinal = urlBruta.startsWith('http') ? urlBruta : `https://${urlBruta}`;

    try {
      const suporta = await Linking.canOpenURL(urlFinal);
      if (suporta) {
        await Linking.openURL(urlFinal);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link fornecido.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao tentar abrir o link da playlist.');
    }
  };

  const confirmarDesvinculacao = (escalaId: number) => {
    Alert.alert(
      'Desvincular Playlist',
      'Deseja realmente remover o link desta playlist da escala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/escalas/${escalaId}/playlist`);
              carregarEscalasComPlaylist();
            } catch (error) {
              console.error('Erro ao desvincular playlist:', error);
              Alert.alert('Erro', 'Não foi possível desvincular a playlist.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: EscalaPlaylist }) => {
    const linkUrl = item.youtubePlaylistUrl || item.linkPlaylistManual;
    const nomeCulto =
      item.culto ||
      item.nomeCultoNoite ||
      item.nomeCultoManha ||
      item.evento ||
      'Culto de Adoração';

    const departamento =
      item.nomeDepartamento || item.departamento?.nome || 'Geral';

    return (
      <View style={styles.card}>
        {/* Cabeçalho do Card */}
        <View style={styles.cardHeader}>
          <View style={styles.dataBadge}>
            <Calendar size={13} color="#FF6B00" />
            <Text style={styles.dataBadgeTexto}>
              {formatarData(item.dataEscala || item.data)}
            </Text>
          </View>

          <View style={styles.depBadge}>
            <Building2 size={12} color="#6B7280" />
            <Text style={styles.depBadgeTexto} numberOfLines={1}>
              {departamento}
            </Text>
          </View>
        </View>

        {/* Informações do Culto */}
        <View style={styles.cultoInfo}>
          <View style={styles.cultoIconeContainer}>
            <Music2 size={18} color="#FF6B00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cultoNome} numberOfLines={2}>
              {nomeCulto}
            </Text>
            {linkUrl && (
              <Text style={styles.linkTexto} numberOfLines={1}>
                {linkUrl}
              </Text>
            )}
          </View>
        </View>

        {/* Linha de Ações */}
        <View style={styles.acoesContainer}>
          {/* Ouvir no YouTube/Link */}
          <TouchableOpacity
            style={styles.btnOuvir}
            activeOpacity={0.8}
            onPress={() => abrirLinkPlaylist(linkUrl)}
          >
            <Play size={13} color="#DC2626" />
            <Text style={styles.btnOuvirTexto}>Ouvir</Text>
            <ExternalLink size={11} color="#DC2626" />
          </TouchableOpacity>

          {/* Entrar na Sala de Ensaio */}
          <TouchableOpacity
            style={styles.btnEstudar}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EstudarPlaylist', { escalaId: item.id })}
          >
            <BookOpen size={13} color="#FF6B00" />
            <Text style={styles.btnEstudarTexto}>Estudo</Text>
          </TouchableOpacity>

          {/* Desvincular Playlist */}
          <TouchableOpacity
            style={styles.btnDesvincular}
            activeOpacity={0.8}
            onPress={() => confirmarDesvinculacao(item.id)}
          >
            <Trash2 size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <Text style={styles.headerBadgeTexto}>REPERTÓRIOS</Text>
          <Text style={styles.headerTitulo}>Gerenciador de Playlists</Text>
        </View>

        {/* Botão de Estudo Rápido */}
        <TouchableOpacity
          style={styles.btnHeaderAcao}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EstudarPlaylist')}
        >
          <BookOpen size={14} color="#FFFFFF" />
          <Text style={styles.btnHeaderAcaoTexto}>Ensaio</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingTexto}>Buscando playlists vinculadas...</Text>
        </View>
      ) : (
        <FlatList
          data={escalas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B00"
              colors={['#FF6B00']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcone}>
                <Music2 size={28} color="#FF6B00" />
              </View>
              <Text style={styles.emptyTitulo}>Nenhuma playlist associada</Text>
              <Text style={styles.emptySub}>
                Não encontramos escalas com links de repertório cadastrados para a sua congregação.
              </Text>
            </View>
          }
        />
      )}
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
  headerBadgeTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 1,
  },
  btnHeaderAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnHeaderAcaoTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTexto: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dataBadgeTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  depBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 140,
  },
  depBadgeTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  cultoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cultoIconeContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cultoNome: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  linkTexto: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  acoesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnOuvir: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnOuvirTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
  btnEstudar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnEstudarTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  btnDesvincular: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 20,
    gap: 8,
  },
  emptyIcone: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
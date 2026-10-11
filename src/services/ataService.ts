import {api} from './api';

export interface OpcaoPauta {
  id: number;
  texto?: string;
  titulo?: string;
  descricao?: string;
  totalVotos?: number;
  porcentagem?: number;
  votadoPeloUsuario?: boolean;
}

export interface Pauta {
  id: number;
  titulo: string;
  descricao?: string;
  ordem?: number;
  requerVotacao: boolean;
  statusVotacao?: 'NAO_INICIADA' | 'EM_VOTACAO' | 'ENCERRADA' | string;
  opcoes?: OpcaoPauta[];
  meuVotoOpcaoId?: number | null;
  jaVotou?: boolean;
  totalVotos?: number;
}

export interface Ata {
  id: number;
  titulo: string;
  dataReuniao?: string;
  horarioInicio?: string;
  localReuniao?: string;
  conteudoAta?: string;
  status?: 'EM_ANDAMENTO' | 'CONCLUIDA' | string;
  pautas?: Pauta[];
}

export const ataService = {
  listar: async (): Promise<Ata[]> => {
    const response = await api.get('/atas');
    return response.data;
  },

  buscarPorId: async (id: number | string): Promise<Ata> => {
    const response = await api.get(`/atas/${id}`);
    return response.data;
  },

  criarAta: async (dadosAta: any) => {
    const response = await api.post('/atas', dadosAta);
    return response.data;
  },

  adicionarPauta: async (ataId: number | string, dados: any) => {
    const response = await api.post(`/pautas/ata/${ataId}`, dados);
    return response.data;
  },

  atualizarStatusPauta: async (pautaId: number | string, status: string) => {
    const res = await api.patch(`/pautas/${pautaId}/status-votacao`, { status });
    return res.data;
  },

  finalizarAta: async (id: number | string) => {
    const response = await api.patch(`/atas/${id}/finalizar`);
    return response.data;
  },

  votarPauta: async (pautaId: number | string, opcaoId: number, justificativa: string | null = null) => {
    const res = await api.post(`/pautas/${pautaId}/votar`, {
      opcaoId: Number(opcaoId),
      justificativa,
    });
    return res.data;
  },
};

export default ataService;
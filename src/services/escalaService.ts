import {api} from './api';

export interface VoluntarioEscalaResponse {
  id: number;
  usuarioId?: number | null;
  nome?: string | null;
  instrumento?: string;
  funcao?: string;
  vago?: boolean;
}

export interface EscalaItemResponse {
  id?: number;
  escalaId?: number;
  data?: string;
  dataEscala?: string;
  departamentoId?: number;
  nomeDepartamento?: string;
  voluntarios?: VoluntarioEscalaResponse[];
  [key: string]: any;
}

export interface MinhasEscalasResponse {
  content?: EscalaItemResponse[];
  escalas?: EscalaItemResponse[];
  [key: string]: any;
}

export interface DadosIniciaisResponse {
  agendas: any[];
  departamentos: any[];
}

export async function buscarMinhasEscalas(): Promise<MinhasEscalasResponse | EscalaItemResponse[]> {
  const response = await api.get<MinhasEscalasResponse | EscalaItemResponse[]>('/escala-musicos/minhas-escalas');
  return response.data;
}

export async function confirmarMinhaEscala(
  escalaId: number,
  confirmado: boolean,
  justificativa: string | null = null
): Promise<any> {
  const response = await api.put(`/escalas/${escalaId}/confirmar`, {
    confirmado,
    justificativa,
  });
  return response.data;
}

export async function atualizarEscala(id: number, dados: Record<string, any>): Promise<any> {
  const response = await api.put(`/escalas/${id}`, dados);
  return response.data;
}

export async function excluirEscala(id: number): Promise<void> {
  await api.delete(`/escalas/${id}`);
}

export async function listarEscalas(): Promise<any> {
  const response = await api.get('/escalas');
  return response.data;
}

export async function buscarDetalhesEscala(id: number): Promise<any> {
  const response = await api.get(`/escalas/${id}/detalhes`);
  return response.data;
}

export async function criarEscala(dados: Record<string, any>): Promise<any> {
  const response = await api.post('/escalas', dados);
  return response.data;
}

export async function gerarEscalasMes(id: number, dados: Record<string, any>): Promise<any> {
  const response = await api.post(`/agenda-mensal/${id}/gerar-escalas`, dados);
  return response.data;
}

export const baixarRelatorioMensalPdf = async (
  agendaMensalId: number,
  departamentoId: number
): Promise<Blob> => {
  const response = await api.get('/escalas/relatorio-mensal', {
    params: { agendaMensalId, departamentoId },
    responseType: 'blob',
  });
  return response.data;
};

export async function gerarEscalasAutomaticas(
  agendaMensalId: number,
  dados: Record<string, any>
): Promise<any> {
  const response = await api.post(
    `/escalas/agenda/${agendaMensalId}/gerar-automaticas`,
    dados
  );
  return response.data;
}

export const regenerarEscalaAutomatica = async (escalaId: number): Promise<any> => {
  const response = await api.put(`/escalas/${escalaId}/regenerar-automatica`);
  return response.data;
};

export const buscarDadosIniciais = async (): Promise<DadosIniciaisResponse> => {
  const [agendas, departamentos] = await Promise.all([
    api.get('/agendas-mensais/ativas'),
    api.get('/departamentos'),
  ]);
  return { agendas: agendas.data, departamentos: departamentos.data };
};

export const listarMusicasDaPlaylistManual = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get<any[]>(`/escala-musicas/escala/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar músicas da playlist da escala ${id}:`, error);
    throw error;
  }
};

export async function buscarEscalasMes(
  departamentoId: number,
  mes: number,
  ano: number
): Promise<EscalaItemResponse[] | { content?: EscalaItemResponse[]; escalas?: EscalaItemResponse[] }> {
  const response = await api.get('/escalas/mes', {
    params: { departamentoId, mes, ano },
  });
  return response.data;
}
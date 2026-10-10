 

export const ataService = {
  listar: async () => {
    const response = await api.get("/atas");
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`/atas/${id}`);
    return response.data;
  },

  // 🟢 Cria a reunião/ata
  criarAta: async (dadosAta) => {
    const response = await api.post("/atas", dadosAta);
    return response.data;
  },

  // 🟢 Adiciona uma pauta a uma ata existente
  adicionarPauta: async (ataId, dados) => {
    // 🟢 Altere de `/atas/${ataId}/pautas` para `/pautas/ata/${ataId}`:
    const response = await api.post(`/pautas/ata/${ataId}`, dados);
    return response.data;
  },

// src/services/ataService.js
atualizarStatusPauta: async (pautaId, status) => {
  const res = await api.patch(`/pautas/${pautaId}/status-votacao`, { status });
  return res.data;
},


  finalizarAta: async (id) => {
    const response = await api.patch(`/atas/${id}/finalizar`);
    return response.data;
  },

  
votarPauta: async (pautaId, opcaoId, justificativa = null) => {
  const res = await api.post(`/pautas/${pautaId}/votar`, {
    opcaoId: Number(opcaoId),
    justificativa: justificativa
  });
  return res.data;
}
};

export default ataService;

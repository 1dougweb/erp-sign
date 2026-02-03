import api from './api.js';

export const estoqueService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);
    if (filters.fornecedor_id) params.append('fornecedor_id', filters.fornecedor_id);
    if (filters.busca) params.append('busca', filters.busca);
    if (filters.estoque_baixo) params.append('estoque_baixo', filters.estoque_baixo);
    
    const response = await api.get(`/estoque?${params.toString()}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/estoque/material/${id}`);
    return response.data;
  },

  async calcularEstoqueAtual(id) {
    const response = await api.post(`/estoque/material/${id}/calcular`);
    return response.data;
  }
};

export const movimentacaoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.material_id) params.append('material_id', filters.material_id);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    
    const response = await api.get(`/estoque/movimentacoes?${params.toString()}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/estoque/movimentacoes/${id}`);
    return response.data;
  },

  async create(movimentacao) {
    const response = await api.post('/estoque/movimentacoes', movimentacao);
    return response.data;
  }
};

export const categoriaService = {
  async getAll() {
    const response = await api.get('/estoque/categorias');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/estoque/categorias/${id}`);
    return response.data;
  },

  async create(categoria) {
    const response = await api.post('/estoque/categorias', categoria);
    return response.data;
  },

  async update(id, categoria) {
    const response = await api.put(`/estoque/categorias/${id}`, categoria);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/estoque/categorias/${id}`);
    return response.data;
  }
};

export const unidadeMedidaService = {
  async getAll() {
    const response = await api.get('/estoque/unidades');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/estoque/unidades/${id}`);
    return response.data;
  },

  async create(unidade) {
    const response = await api.post('/estoque/unidades', unidade);
    return response.data;
  },

  async update(id, unidade) {
    const response = await api.put(`/estoque/unidades/${id}`, unidade);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/estoque/unidades/${id}`);
    return response.data;
  }
};

export const alertaService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.visualizado !== undefined) params.append('visualizado', filters.visualizado);
    if (filters.resolvido !== undefined) params.append('resolvido', filters.resolvido);
    if (filters.tipo_alerta) params.append('tipo_alerta', filters.tipo_alerta);
    
    const response = await api.get(`/estoque/alertas?${params.toString()}`);
    return response.data;
  },

  async marcarVisualizado(id) {
    const response = await api.put(`/estoque/alertas/${id}/visualizado`);
    return response.data;
  },

  async marcarResolvido(id) {
    const response = await api.put(`/estoque/alertas/${id}/resolvido`);
    return response.data;
  },

  async getCountNaoVisualizados() {
    const response = await api.get('/estoque/alertas/nao-visualizados');
    return response.data;
  }
};

export const relatorioService = {
  async movimentacoesPorPeriodo(filters = {}) {
    const params = new URLSearchParams();
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.material_id) params.append('material_id', filters.material_id);
    
    const response = await api.get(`/estoque/relatorios/movimentacoes?${params.toString()}`);
    return response.data;
  },

  async consumoPorMaterial(filters = {}) {
    const params = new URLSearchParams();
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    
    const response = await api.get(`/estoque/relatorios/consumo?${params.toString()}`);
    return response.data;
  },

  async estoqueAtualVsMinimo() {
    const response = await api.get('/estoque/relatorios/estoque-vs-minimo');
    return response.data;
  },

  async historicoRequisicoes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get(`/estoque/relatorios/requisicoes?${params.toString()}`);
    return response.data;
  }
};

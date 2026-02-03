import api from './api.js';

export const fornecedorService = {
  async getAll() {
    const response = await api.get('/estoque/fornecedores');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/estoque/fornecedores/${id}`);
    return response.data;
  },

  async create(fornecedor) {
    const response = await api.post('/estoque/fornecedores', fornecedor);
    return response.data;
  },

  async update(id, fornecedor) {
    const response = await api.put(`/estoque/fornecedores/${id}`, fornecedor);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/estoque/fornecedores/${id}`);
    return response.data;
  }
};

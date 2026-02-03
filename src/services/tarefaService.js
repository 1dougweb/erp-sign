import api from './api.js';

export const tarefaService = {
  async getByProjeto(projetoId) {
    const response = await api.get(`/projetos/${projetoId}/tarefas`);
    return response.data;
  },

  async create(projetoId, tarefa) {
    const response = await api.post(`/projetos/${projetoId}/tarefas`, tarefa);
    return response.data;
  },

  async update(id, tarefa) {
    const response = await api.put(`/tarefas/${id}`, tarefa);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/tarefas/${id}`);
    return response.data;
  },

  async reordenar(tarefas) {
    const response = await api.put('/tarefas/reordenar', { tarefas });
    return response.data;
  }
};

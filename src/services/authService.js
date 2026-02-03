import api from './api.js';

export const authService = {
  async login(email, senha) {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  async register(nome, email, senha) {
    const response = await api.post('/auth/register', { nome, email, senha });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.put('/auth/me', payload);
    return response.data;
  },

  async changePassword(senhaAtual, novaSenha) {
    const response = await api.put('/auth/me/password', { senhaAtual, novaSenha });
    return response.data;
  }
};

import { defineStore } from 'pinia';
import { authService } from '../services/authService.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.nome || '',
    avatarUrl: (state) => state.user?.avatar_url || null,
    isAdmin: (state) => {
      const isAdmin = state.user?.is_admin;
      return isAdmin === true || isAdmin === 1 || isAdmin === '1';
    }
  },

  actions: {
    async login(email, senha) {
      try {
        const data = await authService.login(email, senha);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Erro ao fazer login' };
      }
    },

    async register(nome, email, senha) {
      try {
        const data = await authService.register(nome, email, senha);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Erro ao registrar' };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    async refreshUser() {
      try {
        const data = await authService.getMe();
        this.user = data;
        localStorage.setItem('user', JSON.stringify(data));
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
      }
    },

    async updateProfile(payload) {
      try {
        const data = await authService.updateProfile(payload);
        this.user = data;
        localStorage.setItem('user', JSON.stringify(data));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Erro ao atualizar perfil'
        };
      }
    },

    async changePassword(senhaAtual, novaSenha) {
      try {
        await authService.changePassword(senhaAtual, novaSenha);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Erro ao atualizar senha'
        };
      }
    }
  }
});

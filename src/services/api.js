import axios from 'axios';

// Detectar automaticamente a URL base da API
// Se estiver em desenvolvimento e acessado via IP, usa o proxy do Vite
// Caso contrário, usa a variável de ambiente ou localhost
const getBaseURL = () => {
  // Se tiver variável de ambiente definida, usa ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Em desenvolvimento, usa o proxy do Vite (relativo)
  // O Vite proxy redireciona /api para http://localhost:3000/api
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Em produção, usa localhost como fallback
  return 'https://automacao-erp-backend.qiqivn.easypanel.host/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

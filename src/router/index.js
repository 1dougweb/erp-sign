import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.js';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'projetos',
        name: 'Projetos',
        component: () => import('../views/Projetos.vue')
      },
      {
        path: 'projetos/:id/tarefas',
        name: 'Tarefas',
        component: () => import('../views/Tarefas.vue')
      },
      {
        path: 'cronograma',
        name: 'CronogramaInstalacao',
        component: () => import('../views/CronogramaInstalacao.vue')
      },
      {
        path: 'funcionarios',
        name: 'Funcionarios',
        component: () => import('../views/Funcionarios.vue')
      },
      {
        path: 'equipes',
        name: 'Equipes',
        component: () => import('../views/Equipes.vue')
      },
      {
        path: 'materiais',
        name: 'Materiais',
        component: () => import('../views/Materiais.vue')
      },
      {
        path: 'carros',
        name: 'Carros',
        component: () => import('../views/Carros.vue')
      },
      {
        path: 'orcamentos',
        name: 'Orcamentos',
        component: () => import('../views/Orcamentos.vue')
      },
      {
        path: 'configuracoes',
        name: 'Configuracoes',
        component: () => import('../views/Configuracoes.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'perfil',
        name: 'Perfil',
        component: () => import('../views/Perfil.vue')
      },
      {
        path: 'estoque',
        name: 'Estoque',
        component: () => import('../views/Estoque.vue')
      },
      {
        path: 'estoque/movimentacoes',
        name: 'MovimentacoesEstoque',
        component: () => import('../views/MovimentacoesEstoque.vue')
      },
      {
        path: 'estoque/relatorios',
        name: 'RelatoriosEstoque',
        component: () => import('../views/RelatoriosEstoque.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'requisicoes',
        name: 'Requisicoes',
        component: () => import('../views/Requisicoes.vue')
      },
      {
        path: 'equipamentos',
        name: 'Equipamentos',
        component: () => import('../views/Equipamentos.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'fornecedores',
        name: 'Fornecedores',
        component: () => import('../views/Fornecedores.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Redirecionar rota antiga do orçamento 3D
  if (to.path === '/orcamento-3d') {
    next('/orcamentos');
    return;
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/');
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;

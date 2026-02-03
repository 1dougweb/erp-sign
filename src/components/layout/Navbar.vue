<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <button v-if="showMenuToggle" class="menu-toggle" @click="$emit('toggle-menu')">
          <Bars3Icon class="icon" />
        </button>
        <h1 class="navbar-title">Sistema Todo & Instalação</h1>
      </div>
      <div class="navbar-right">
        <!-- Busca Rápida -->
        <div class="search-container">
          <MagnifyingGlassIcon class="search-icon" />
          <input
            type="text"
            v-model="searchQuery"
            @focus="showSearchResults = true"
            @blur="handleSearchBlur"
            @input="handleSearch"
            placeholder="Buscar..."
            class="search-input"
          />
          <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="search-result-item"
              @click="navigateToResult(result)"
            >
              <component :is="getResultIcon(result.type)" class="result-icon" />
              <div class="result-content">
                <div class="result-title">{{ result.title }}</div>
                <div class="result-subtitle">{{ result.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notificações -->
        <div class="notification-container" v-if="authStore.isAuthenticated">
          <button class="notification-btn" @click="toggleNotifications">
            <BellIcon class="icon" />
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>
          <div v-if="showNotifications" class="notification-dropdown">
            <div class="notification-header">
              <h3>Notificações</h3>
              <button
                v-if="unreadCount > 0"
                @click="markAllAsRead"
                class="btn-link"
              >
                Marcar todas como lidas
              </button>
            </div>
            <div class="notification-list">
              <div
                v-for="alerta in alertas.slice(0, 10)"
                :key="alerta.id"
                class="notification-item"
                :class="{ unread: !alerta.visualizado }"
                @click="handleNotificationClick(alerta)"
              >
                <div class="notification-icon" :class="getAlertaClass(alerta.tipo_alerta)">
                  <ExclamationTriangleIcon v-if="alerta.tipo_alerta === 'estoque_baixo'" class="icon-sm" />
                  <XCircleIcon v-else-if="alerta.tipo_alerta === 'estoque_zero'" class="icon-sm" />
                  <InformationCircleIcon v-else class="icon-sm" />
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ alerta.material_nome }}</div>
                  <div class="notification-message">{{ getAlertaMessage(alerta) }}</div>
                  <div class="notification-time">{{ formatTime(alerta.data_alerta) }}</div>
                </div>
              </div>
              <div v-if="alertas.length === 0" class="notification-empty">
                <p>Nenhuma notificação</p>
              </div>
            </div>
            <div v-if="alertas.length > 10" class="notification-footer">
              <router-link to="/estoque" @click="showNotifications = false">
                Ver todas as notificações
              </router-link>
            </div>
          </div>
        </div>

        <!-- Perfil do Usuário -->
        <div class="profile-container" v-if="authStore.isAuthenticated">
          <button class="profile-btn" @click="toggleProfile">
            <div class="profile-avatar" v-if="avatarUrl">
              <img :src="avatarUrl" alt="Avatar" />
            </div>
            <div class="profile-avatar profile-avatar-initials" v-else>
              {{ userInitials }}
            </div>
            <span class="profile-name">{{ userName }}</span>
            <ChevronDownIcon class="icon-sm" />
          </button>
          <div v-if="showProfile" class="profile-dropdown">
            <div class="profile-info">
              <div class="profile-avatar-large" v-if="avatarUrl">
                <img :src="avatarUrl" alt="Avatar" />
              </div>
              <div class="profile-avatar-large profile-avatar-large-initials" v-else>
                {{ userInitials }}
              </div>
              <div class="profile-details">
                <div class="profile-name-large">{{ userName }}</div>
                <div class="profile-email">{{ authStore.user?.email || '' }}</div>
                <div v-if="authStore.isAdmin" class="profile-badge">Administrador</div>
              </div>
            </div>
            <div class="profile-menu">
              <router-link
                to="/perfil"
                @click="showProfile = false"
                class="profile-menu-item"
              >
                <UserIcon class="icon-sm" />
                <span>Meu Perfil</span>
              </router-link>
              <router-link to="/" @click="showProfile = false" class="profile-menu-item">
                <HomeIcon class="icon-sm" />
                <span>Dashboard</span>
              </router-link>
              <router-link
                v-if="authStore.isAdmin"
                to="/configuracoes"
                @click="showProfile = false"
                class="profile-menu-item"
              >
                <Cog6ToothIcon class="icon-sm" />
                <span>Configurações</span>
              </router-link>
              <button @click="handleLogout" class="profile-menu-item logout">
                <ArrowRightOnRectangleIcon class="icon-sm" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth.js';
import { alertaService } from '../../services/estoqueService.js';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  HomeIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';

defineProps({
  showMenuToggle: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle-menu']);

const authStore = useAuthStore();
const router = useRouter();

const showNotifications = ref(false);
const showProfile = ref(false);
const showSearchResults = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const alertas = ref([]);
const unreadCount = ref(0);

const userName = computed(() => authStore.userName);
const avatarUrl = computed(() => authStore.avatarUrl);
const userInitials = computed(() => {
  const name = authStore.userName || '';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

// Fechar dropdowns ao clicar fora
const handleClickOutside = (event) => {
  if (!event.target.closest('.notification-container')) {
    showNotifications.value = false;
  }
  if (!event.target.closest('.profile-container')) {
    showProfile.value = false;
  }
  if (!event.target.closest('.search-container')) {
    showSearchResults.value = false;
  }
};

const handleSearchBlur = () => {
  // Delay para permitir cliques nos resultados
  setTimeout(() => {
    showSearchResults.value = false;
  }, 200);
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  showProfile.value = false;
  if (showNotifications.value) {
    loadAlertas();
  }
};

const toggleProfile = () => {
  showProfile.value = !showProfile.value;
  showNotifications.value = false;
};

const loadAlertas = async () => {
  try {
    const data = await alertaService.getAll({ resolvido: false });
    alertas.value = data;
    
    // Contar não visualizados
    const countData = await alertaService.getCountNaoVisualizados();
    unreadCount.value = countData.count || 0;
  } catch (error) {
    console.error('Erro ao carregar alertas:', error);
  }
};

const markAllAsRead = async () => {
  try {
    const unreadAlertas = alertas.value.filter(a => !a.visualizado);
    await Promise.all(unreadAlertas.map(a => alertaService.marcarVisualizado(a.id)));
    await loadAlertas();
  } catch (error) {
    console.error('Erro ao marcar alertas como lidas:', error);
  }
};

const handleNotificationClick = async (alerta) => {
  if (!alerta.visualizado) {
    try {
      await alertaService.marcarVisualizado(alerta.id);
      await loadAlertas();
    } catch (error) {
      console.error('Erro ao marcar alerta:', error);
    }
  }
  showNotifications.value = false;
  router.push('/estoque');
};

const getAlertaMessage = (alerta) => {
  if (alerta.tipo_alerta === 'estoque_baixo') {
    return `Estoque baixo: ${alerta.quantidade_estoque} ${alerta.estoque_minimo ? `(mínimo: ${alerta.estoque_minimo})` : ''}`;
  }
  if (alerta.tipo_alerta === 'estoque_zero') {
    return 'Estoque zerado';
  }
  return alerta.mensagem || 'Alerta de estoque';
};

const getAlertaClass = (tipo) => {
  if (tipo === 'estoque_zero') return 'alert-zero';
  if (tipo === 'estoque_baixo') return 'alert-low';
  return 'alert-info';
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR');
};

const handleSearch = () => {
  // Implementar busca rápida se necessário
  // Por enquanto, apenas limpar resultados
  searchResults.value = [];
};

const getResultIcon = (type) => {
  // Retornar ícone baseado no tipo
  return InformationCircleIcon;
};

const navigateToResult = (result) => {
  showSearchResults.value = false;
  router.push(result.route);
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

// Carregar alertas periodicamente
let alertInterval = null;

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  if (authStore.isAuthenticated) {
    loadAlertas();
    // Atualizar alertas a cada 5 minutos
    alertInterval = setInterval(loadAlertas, 5 * 60 * 1000);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (alertInterval) {
    clearInterval(alertInterval);
  }
});
</script>

<style scoped>
.navbar {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-content {
  max-width: 100%;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: var(--bg-color);
}

.menu-toggle .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.navbar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Busca */
.search-container {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 300px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-light);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: var(--bg-color);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background: white;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: var(--bg-color);
}

.result-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-light);
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.result-subtitle {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}

/* Notificações */
.notification-container {
  position: relative;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.notification-btn:hover {
  background-color: var(--bg-color);
}

.notification-btn .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--danger-color);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 1.25rem;
  text-align: center;
  transform: translate(25%, -25%);
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 360px;
  max-width: calc(100vw - 2rem);
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.notification-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.btn-link:hover {
  text-decoration: underline;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notification-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: var(--bg-color);
}

.notification-item.unread {
  background-color: #eff6ff;
}

.notification-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon.alert-zero {
  background: #fee2e2;
  color: #dc2626;
}

.notification-icon.alert-low {
  background: #fef3c7;
  color: #d97706;
}

.notification-icon.alert-info {
  background: #dbeafe;
  color: #2563eb;
}

.notification-icon .icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.875rem;
  color: var(--text-light);
  margin-bottom: 0.25rem;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-light);
}

.notification-empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-light);
}

.notification-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.notification-footer a {
  color: var(--primary-color);
  font-size: 0.875rem;
  text-decoration: none;
}

.notification-footer a:hover {
  text-decoration: underline;
}

/* Perfil */
.profile-container {
  position: relative;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.profile-btn:hover {
  background-color: var(--bg-color);
}

.profile-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-avatar-initials {
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  display: none;
}

.profile-btn .icon-sm {
  width: 1rem;
  height: 1rem;
  color: var(--text-light);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 280px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
}

.profile-info {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
}

.profile-avatar-large {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 0.75rem;
}

.profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-avatar-large-initials {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-details {
  text-align: center;
}

.profile-name-large {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.profile-email {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.profile-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.profile-menu {
  padding: 0.5rem;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  text-decoration: none;
}

.profile-menu-item:hover {
  background-color: var(--bg-color);
}

.profile-menu-item.logout {
  color: var(--danger-color);
}

.profile-menu-item .icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 0.75rem 1rem;
  }

  .navbar-title {
    font-size: 1rem;
  }

  .search-container {
    display: none;
  }

  .profile-name {
    display: none;
  }

  .notification-dropdown {
    width: calc(100vw - 2rem);
    right: -1rem;
  }

  .profile-dropdown {
    width: calc(100vw - 2rem);
    right: -1rem;
  }
}
</style>

<template>
  <aside :class="['sidebar', { 'sidebar-open': isOpen, 'sidebar-mobile': isMobile }]">
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        :class="{ 'sidebar-item-active': isActive(item.path) }"
        @click="handleClick"
      >
        <component
          :is="isActive(item.path) ? item.iconSolid : item.iconOutline"
          class="sidebar-icon"
        />
        <span class="sidebar-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
  <div v-if="isOpen && isMobile" class="sidebar-overlay" @click="$emit('close')"></div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../store/auth.js';
import {
  ChartBarIcon as ChartBarIconOutline,
  FolderIcon as FolderIconOutline,
  CalendarIcon as CalendarIconOutline,
  UserGroupIcon as UserGroupIconOutline,
  UserIcon as UserIconOutline,
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline,
  TruckIcon as TruckIconOutline,
  DocumentTextIcon as DocumentTextIconOutline,
  Cog6ToothIcon as Cog6ToothIconOutline,
  CubeIcon as CubeIconOutline,
  ClipboardDocumentListIcon as ClipboardDocumentListIconOutline,
  WrenchIcon as WrenchIconOutline
} from '@heroicons/vue/24/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
  FolderIcon as FolderIconSolid,
  CalendarIcon as CalendarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  TruckIcon as TruckIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CubeIcon as CubeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  WrenchIcon as WrenchIconSolid
} from '@heroicons/vue/24/solid';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const route = useRoute();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const items = [
    { path: '/', label: 'Dashboard', iconOutline: ChartBarIconOutline, iconSolid: ChartBarIconSolid },
    { path: '/projetos', label: 'Projetos', iconOutline: FolderIconOutline, iconSolid: FolderIconSolid },
    { path: '/cronograma', label: 'Cronograma', iconOutline: CalendarIconOutline, iconSolid: CalendarIconSolid },
    { path: '/orcamentos', label: 'Orçamentos', iconOutline: DocumentTextIconOutline, iconSolid: DocumentTextIconSolid },
    { path: '/estoque', label: 'Estoque', iconOutline: CubeIconOutline, iconSolid: CubeIconSolid },
    { path: '/requisicoes', label: 'Requisições', iconOutline: ClipboardDocumentListIconOutline, iconSolid: ClipboardDocumentListIconSolid },
    { path: '/equipamentos', label: 'Equipamentos', iconOutline: WrenchIconOutline, iconSolid: WrenchIconSolid, adminOnly: true },
    { path: '/funcionarios', label: 'Funcionários', iconOutline: UserGroupIconOutline, iconSolid: UserGroupIconSolid },
    { path: '/equipes', label: 'Equipes', iconOutline: UserIconOutline, iconSolid: UserIconSolid },
    { path: '/materiais', label: 'Materiais', iconOutline: WrenchScrewdriverIconOutline, iconSolid: WrenchScrewdriverIconSolid },
    { path: '/carros', label: 'Carros', iconOutline: TruckIconOutline, iconSolid: TruckIconSolid },
    { path: '/configuracoes', label: 'Configurações', iconOutline: Cog6ToothIconOutline, iconSolid: Cog6ToothIconSolid, adminOnly: true }
  ];
  
  return items.filter(item => !item.adminOnly || authStore.isAdmin);
});

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const handleClick = () => {
  // Fechar sidebar em mobile ao clicar
  if (props.isMobile) {
    emit('close');
  }
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  height: calc(100vh - 65px);
  position: fixed;
  left: 0;
  top: 65px;
  transition: transform 0.3s ease;
  overflow-y: auto;
  z-index: 90;
}

.sidebar-mobile {
  transform: translateX(-100%);
}

.sidebar-mobile.sidebar-open {
  transform: translateX(0);
}

.sidebar-nav {
  padding: 1rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-color);
}

.sidebar-item-active {
  background-color: rgba(79, 70, 229, 0.1);
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 500;
}

.sidebar-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.sidebar-label {
  font-size: 0.875rem;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 80;
}

@media (min-width: 769px) {
  .sidebar-mobile {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    box-shadow: var(--shadow-lg);
  }
}
</style>

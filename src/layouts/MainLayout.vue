<template>
  <div class="main-layout">
    <Navbar :show-menu-toggle="isMobile" @toggle-menu="toggleSidebar" />
    <div class="layout-content">
      <Sidebar :is-open="sidebarOpen" :is-mobile="isMobile" @close="closeSidebar" />
      <main :class="['main-content', { 'main-content-full': !sidebarOpen && isMobile }]">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../store/auth.js';
import Navbar from '../components/layout/Navbar.vue';
import Sidebar from '../components/layout/Sidebar.vue';

const authStore = useAuthStore();
const sidebarOpen = ref(true);
const isMobile = ref(window.innerWidth <= 768);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    sidebarOpen.value = true;
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

onMounted(() => {
  window.addEventListener('resize', checkMobile);
  checkMobile();
  
  // Atualizar dados do usuário ao montar (para garantir que isAdmin está atualizado)
  if (authStore.isAuthenticated) {
    authStore.refreshUser();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-content {
  display: flex;
  flex: 1;
  padding: 1.25rem;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 65px);
  overflow-y: auto;
  max-width: calc(100vw - 250px);
  box-sizing: border-box;
}

.main-content-full {
  margin-left: 0;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1.25rem;
    max-width: 100vw;
  }
}
</style>

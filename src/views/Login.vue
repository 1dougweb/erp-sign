<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Login</h1>
      <form @submit.prevent="handleLogin" class="auth-form">
        <Input
          id="email"
          v-model="email"
          label="Email"
          type="email"
          placeholder="seu@email.com"
          :error="errors.email"
          required
        />
        <Input
          id="senha"
          v-model="senha"
          label="Senha"
          type="password"
          placeholder="••••••••"
          :error="errors.senha"
          required
        />
        <Button type="submit" :loading="loading" full-width>Entrar</Button>
        <p class="auth-link">
          Não tem uma conta?
          <router-link to="/register">Registre-se</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../store/auth.js';
import Input from '../components/common/Input.vue';
import Button from '../components/common/Button.vue';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const email = ref('');
const senha = ref('');
const loading = ref(false);
const errors = ref({});

const handleLogin = async () => {
  errors.value = {};
  loading.value = true;

  const result = await authStore.login(email.value, senha.value);

  if (result.success) {
    toast.success('Login realizado com sucesso!');
    router.push('/');
  } else {
    toast.error(result.error || 'Erro ao fazer login');
    errors.value.senha = result.error;
  }

  loading.value = false;
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.auth-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-color);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-link {
  text-align: center;
  margin-top: 1rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

.auth-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>

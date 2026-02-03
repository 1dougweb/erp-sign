<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Registrar</h1>
      <form @submit.prevent="handleRegister" class="auth-form">
        <Input
          id="nome"
          v-model="nome"
          label="Nome"
          type="text"
          placeholder="Seu nome completo"
          :error="errors.nome"
          required
        />
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
        <Input
          id="confirmarSenha"
          v-model="confirmarSenha"
          label="Confirmar Senha"
          type="password"
          placeholder="••••••••"
          :error="errors.confirmarSenha"
          required
        />
        <Button type="submit" :loading="loading" full-width>Registrar</Button>
        <p class="auth-link">
          Já tem uma conta?
          <router-link to="/login">Faça login</router-link>
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

const nome = ref('');
const email = ref('');
const senha = ref('');
const confirmarSenha = ref('');
const loading = ref(false);
const errors = ref({});

const handleRegister = async () => {
  errors.value = {};

  if (senha.value !== confirmarSenha.value) {
    errors.value.confirmarSenha = 'As senhas não coincidem';
    return;
  }

  if (senha.value.length < 6) {
    errors.value.senha = 'A senha deve ter pelo menos 6 caracteres';
    return;
  }

  loading.value = true;

  const result = await authStore.register(nome.value, email.value, senha.value);

  if (result.success) {
    toast.success('Registro realizado com sucesso!');
    router.push('/');
  } else {
    toast.error(result.error || 'Erro ao registrar');
    if (result.error.includes('Email')) {
      errors.value.email = result.error;
    }
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

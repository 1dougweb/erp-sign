<template>
  <div class="perfil-page">
    <div class="page-header">
      <h1 class="page-title">Meu Perfil</h1>
    </div>

    <div class="perfil-grid">
      <!-- Dados da conta -->
      <div class="card">
        <h2 class="section-title">Dados da conta</h2>
        <form @submit.prevent="salvarPerfil" class="form">
          <div class="perfil-avatar-wrapper">
            <ImageUpload
              v-model="form.avatar_url"
              label="Foto de Perfil"
            />
          </div>

          <Input
            id="nome"
            v-model="form.nome"
            label="Nome"
            placeholder="Seu nome"
            :error="errors.nome"
            required
          />

          <Input
            id="email"
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            :error="errors.email"
            required
          />

          <div class="perfil-actions">
            <Button type="submit" :loading="salvandoPerfil">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>

      <!-- Alterar senha -->
      <div class="card">
        <h2 class="section-title">Alterar senha</h2>
        <form @submit.prevent="salvarSenha" class="form">
          <Input
            id="senhaAtual"
            v-model="senhaForm.senhaAtual"
            label="Senha atual"
            type="password"
            placeholder="••••••••"
            :error="errors.senhaAtual"
            required
          />

          <Input
            id="novaSenha"
            v-model="senhaForm.novaSenha"
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            :error="errors.novaSenha"
            required
          />

          <Input
            id="confirmarNovaSenha"
            v-model="senhaForm.confirmarNovaSenha"
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            :error="errors.confirmarNovaSenha"
            required
          />

          <div class="perfil-actions">
            <Button type="submit" variant="secondary" :loading="salvandoSenha">
              Atualizar senha
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../store/auth.js';
import Input from '../components/common/Input.vue';
import Button from '../components/common/Button.vue';
import ImageUpload from '../components/common/ImageUpload.vue';

const authStore = useAuthStore();
const toast = useToast();

const form = ref({
  nome: '',
  email: '',
  avatar_url: ''
});

const senhaForm = ref({
  senhaAtual: '',
  novaSenha: '',
  confirmarNovaSenha: ''
});

const errors = ref({});
const salvandoPerfil = ref(false);
const salvandoSenha = ref(false);

onMounted(() => {
  if (authStore.user) {
    form.value.nome = authStore.user.nome || '';
    form.value.email = authStore.user.email || '';
    form.value.avatar_url = authStore.user.avatar_url || '';
  }
});

const salvarPerfil = async () => {
  errors.value = {};

  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
  }
  if (!form.value.email.trim()) {
    errors.value.email = 'Email é obrigatório';
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  salvandoPerfil.value = true;
  const payload = {
    nome: form.value.nome.trim(),
    email: form.value.email.trim(),
    avatar_url: form.value.avatar_url || null
  };

  const result = await authStore.updateProfile(payload);
  salvandoPerfil.value = false;

  if (result.success) {
    toast.success('Perfil atualizado com sucesso!');
  } else {
    toast.error(result.error);
    if (result.error.toLowerCase().includes('email')) {
      errors.value.email = result.error;
    }
  }
};

const salvarSenha = async () => {
  errors.value = {};

  if (!senhaForm.value.senhaAtual) {
    errors.value.senhaAtual = 'Informe a senha atual';
  }
  if (!senhaForm.value.novaSenha) {
    errors.value.novaSenha = 'Informe a nova senha';
  } else if (senhaForm.value.novaSenha.length < 6) {
    errors.value.novaSenha = 'A nova senha deve ter pelo menos 6 caracteres';
  }
  if (senhaForm.value.novaSenha !== senhaForm.value.confirmarNovaSenha) {
    errors.value.confirmarNovaSenha = 'As senhas não coincidem';
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  salvandoSenha.value = true;
  const result = await authStore.changePassword(
    senhaForm.value.senhaAtual,
    senhaForm.value.novaSenha
  );
  salvandoSenha.value = false;

  if (result.success) {
    toast.success('Senha atualizada com sucesso!');
    senhaForm.value.senhaAtual = '';
    senhaForm.value.novaSenha = '';
    senhaForm.value.confirmarNovaSenha = '';
  } else {
    toast.error(result.error);
    errors.value.senhaAtual = result.error;
  }
};
</script>

<style scoped>
.perfil-page {
  max-width: 900px;
}

.perfil-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 1.5rem;
}

.card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
}

.perfil-avatar-wrapper {
  margin-bottom: 0.5rem;
}

.perfil-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .perfil-grid {
    grid-template-columns: 1fr;
  }
}
</style>


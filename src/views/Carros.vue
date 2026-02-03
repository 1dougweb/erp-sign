<template>
  <div class="carros-page">
    <div class="page-header">
      <h1 class="page-title">Carros</h1>
      <Button @click="openModal">+ Novo Carro</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="carros.length === 0" class="empty-state">
      <p>Nenhum carro cadastrado. Cadastre o primeiro!</p>
    </div>
    <div v-else class="carros-list">
      <div v-for="carro in carros" :key="carro.id" class="carro-card">
        <div v-if="carro.imagem_url" class="carro-image">
          <img :src="carro.imagem_url" :alt="carro.modelo" />
        </div>
        <div class="carro-header">
          <div>
            <h3>{{ carro.modelo }}</h3>
            <p class="carro-info">
              <span v-if="carro.marca">{{ carro.marca }} - </span>
              <span v-if="carro.ano">{{ carro.ano }}</span>
            </p>
            <p class="carro-placa">Placa: {{ carro.placa }}</p>
            <div v-if="getRodizioInfo(carro.placa)" class="rodizio-info">
              <span class="rodizio-label">Rodízio:</span>
              <span :class="['rodizio-dia', { 'rodizio-hoje': getRodizioInfo(carro.placa).aviso }]">
                {{ getRodizioInfo(carro.placa).diaNome }}
              </span>
              <span v-if="getRodizioInfo(carro.placa).aviso" class="rodizio-aviso">
                ⚠️ Hoje é dia de rodízio!
              </span>
            </div>
          </div>
          <div class="carro-actions">
            <button class="btn btn-outline" @click="editCarro(carro)">Editar</button>
            <button class="btn btn-danger" @click="deleteCarro(carro.id)">Excluir</button>
          </div>
        </div>
        <span :class="['status-badge', carro.disponivel ? 'status-available' : 'status-unavailable']">
          {{ carro.disponivel ? 'Disponível' : 'Indisponível' }}
        </span>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingCarro && editingCarro.id ? 'Editar Carro' : 'Novo Carro'"
      position="right"
      @confirm="saveCarro"
      @close="closeModal"
    >
      <form @submit.prevent="saveCarro" class="form">
        <ImageUpload
          v-model="form.imagem_url"
          label="Foto do Veículo"
        />
        <Input
          id="placa"
          v-model="form.placa"
          label="Placa *"
          placeholder="ABC-1234"
          :error="errors.placa"
          required
        />
        <div v-if="form.placa && getRodizioInfo(form.placa).diaNome" class="rodizio-preview">
          <div class="rodizio-preview-content">
            <span class="rodizio-preview-label">Dia de Rodízio:</span>
            <span :class="['rodizio-preview-dia', { 'rodizio-preview-hoje': getRodizioInfo(form.placa).aviso }]">
              {{ getRodizioInfo(form.placa).diaNome }}
            </span>
            <span v-if="getRodizioInfo(form.placa).aviso" class="rodizio-preview-aviso">
              ⚠️ Hoje é dia de rodízio!
            </span>
          </div>
        </div>
        <Input
          id="modelo"
          v-model="form.modelo"
          label="Modelo *"
          placeholder="Ex: Fiesta, Gol"
          :error="errors.modelo"
          required
        />
        <div class="form-row">
          <Input
            id="marca"
            v-model="form.marca"
            label="Marca"
            placeholder="Ex: Ford, Volkswagen"
          />
          <Input
            id="ano"
            v-model.number="form.ano"
            label="Ano"
            type="number"
            placeholder="2020"
          />
        </div>
        <div class="input-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.disponivel" />
            Disponível
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveCarro">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { carroService } from '../services/carroService.js';
import { calcularDiaRodizio } from '../utils/rodizioUtils.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import ImageUpload from '../components/common/ImageUpload.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const carros = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingCarro = ref(null);
const form = ref({
  placa: '',
  modelo: '',
  marca: '',
  ano: null,
  imagem_url: '',
  disponivel: true
});
const errors = ref({});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingCarro.value = null;
    form.value = { placa: '', modelo: '', marca: '', ano: null, imagem_url: '', disponivel: true };
    errors.value = {};
  }
});

onMounted(() => {
  loadCarros();
});

const loadCarros = async () => {
  try {
    loading.value = true;
    carros.value = await carroService.getAll();
  } catch (error) {
    toast.error('Erro ao carregar carros');
  } finally {
    loading.value = false;
  }
};

const openModal = (carro = null) => {
  // Limpar estado anterior
  editingCarro.value = null;
  form.value = { placa: '', modelo: '', marca: '', ano: null, imagem_url: '', disponivel: true };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (carro && carro.id) {
    editingCarro.value = carro;
    form.value = { ...carro };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingCarro.value = null;
  form.value = { placa: '', modelo: '', marca: '', ano: null, imagem_url: '', disponivel: true };
  errors.value = {};
};

const saveCarro = async () => {
  if (!form.value.placa.trim()) {
    errors.value.placa = 'Placa é obrigatória';
    return;
  }
  if (!form.value.modelo.trim()) {
    errors.value.modelo = 'Modelo é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingCarro.value && editingCarro.value.id) {
      await carroService.update(editingCarro.value.id, form.value);
      toast.success('Carro atualizado com sucesso!');
    } else {
      await carroService.create(form.value);
      toast.success('Carro criado com sucesso!');
    }
    closeModal();
    loadCarros();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar carro');
    console.error('Erro ao salvar carro:', error);
  }
};

const editCarro = (carro) => {
  openModal(carro);
};

const deleteCarro = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este carro?')) {
    return;
  }

  try {
    await carroService.delete(id);
    toast.success('Carro excluído com sucesso!');
    loadCarros();
  } catch (error) {
    toast.error('Erro ao excluir carro');
  }
};

const getRodizioInfo = (placa) => {
  return calcularDiaRodizio(placa);
};
</script>

<style scoped>
.carros-page {
  max-width: 1200px;
}


.carros-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.carro-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.carro-image {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carro-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.carro-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.carro-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.carro-info {
  color: var(--text-light);
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.carro-placa {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.carro-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-available {
  background-color: #d1fae5;
  color: #065f46;
}

.status-unavailable {
  background-color: #fee2e2;
  color: #991b1b;
}

.rodizio-info {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rodizio-label {
  font-size: 0.75rem;
  color: var(--text-light);
  font-weight: 500;
}

.rodizio-dia {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
}

.rodizio-dia.rodizio-hoje {
  color: #dc2626;
  font-weight: 700;
}

.rodizio-aviso {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  background-color: #fee2e2;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
  margin-top: 0.25rem;
}

.rodizio-preview {
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: var(--bg-color);
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
}

.rodizio-preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rodizio-preview-label {
  font-size: 0.75rem;
  color: var(--text-light);
  font-weight: 500;
}

.rodizio-preview-dia {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--primary-color);
}

.rodizio-preview-dia.rodizio-preview-hoje {
  color: #dc2626;
  font-weight: 700;
}

.rodizio-preview-aviso {
  font-size: 0.8125rem;
  color: #dc2626;
  font-weight: 600;
  background-color: #fee2e2;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .carros-list {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

}
</style>

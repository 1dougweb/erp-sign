<template>
  <div class="materiais-page">
    <div class="page-header">
      <h1 class="page-title">Materiais e Ferramentas</h1>
      <Button @click="openModal">+ Novo Material</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="materiais.length === 0" class="empty-state">
      <p>Nenhum material cadastrado. Cadastre o primeiro!</p>
    </div>
    <div v-else class="materiais-list">
      <div v-for="material in materiais" :key="material.id" class="material-card">
        <div v-if="material.imagem_url" class="material-image">
          <img :src="material.imagem_url" :alt="material.nome" />
        </div>
        <div class="material-content">
          <div class="material-header">
            <div>
              <h3>{{ material.nome }}</h3>
              <span :class="['material-type', material.tipo === 'ferramenta' ? 'type-ferramenta' : 'type-material']">
                {{ material.tipo === 'ferramenta' ? '🔧 Ferramenta' : '📦 Material' }}
              </span>
            </div>
            <div class="material-actions">
              <button class="btn btn-sm btn-outline" @click="editMaterial(material)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="deleteMaterial(material.id)">Excluir</button>
            </div>
          </div>
          <p v-if="material.descricao" class="material-descricao">{{ material.descricao }}</p>
          <div class="material-info">
            <span>Estoque: {{ material.quantidade_estoque }} {{ material.unidade || 'un' }}</span>
          </div>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingMaterial && editingMaterial.id ? 'Editar Material' : 'Novo Material'"
      position="right"
      @confirm="saveMaterial"
      @close="closeModal"
    >
      <form @submit.prevent="saveMaterial" class="form">
        <ImageUpload
          v-model="form.imagem_url"
          label="Imagem do Material"
        />
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome *"
          placeholder="Ex: Parafuso 6mm"
          :error="errors.nome"
          required
        />
        <div class="input-group">
          <label for="tipo" class="input-label">Tipo</label>
          <select id="tipo" v-model="form.tipo" class="input">
            <option value="material">Material</option>
            <option value="ferramenta">Ferramenta</option>
          </select>
        </div>
        <div class="input-group">
          <label for="descricao" class="input-label">Descrição</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="input"
            rows="3"
            placeholder="Descrição do material..."
          ></textarea>
        </div>
        <div class="form-row">
          <Input
            id="quantidade_estoque"
            v-model.number="form.quantidade_estoque"
            label="Quantidade em Estoque"
            type="number"
            min="0"
          />
          <Input
            id="unidade"
            v-model="form.unidade"
            label="Unidade"
            placeholder="Ex: un, kg, m"
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveMaterial">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { materialService } from '../services/materialService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';
import ImageUpload from '../components/common/ImageUpload.vue';

const toast = useToast();

const materiais = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingMaterial = ref(null);
const form = ref({
  nome: '',
  tipo: 'material',
  descricao: '',
  quantidade_estoque: 0,
  unidade: '',
  imagem_url: ''
});
const errors = ref({});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingMaterial.value = null;
    form.value = { nome: '', tipo: 'material', descricao: '', quantidade_estoque: 0, unidade: '', imagem_url: '' };
    errors.value = {};
  }
});

onMounted(() => {
  loadMateriais();
});

const loadMateriais = async () => {
  try {
    loading.value = true;
    materiais.value = await materialService.getAll();
  } catch (error) {
    toast.error('Erro ao carregar materiais');
  } finally {
    loading.value = false;
  }
};

const openModal = (material = null) => {
  // Limpar estado anterior
  editingMaterial.value = null;
  form.value = { nome: '', tipo: 'material', descricao: '', quantidade_estoque: 0, unidade: '', imagem_url: '' };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (material && material.id) {
    editingMaterial.value = material;
    form.value = { 
      nome: material.nome || '',
      tipo: material.tipo || 'material',
      descricao: material.descricao || '',
      quantidade_estoque: material.quantidade_estoque || 0,
      unidade: material.unidade || '',
      imagem_url: material.imagem_url || ''
    };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingMaterial.value = null;
  form.value = { nome: '', tipo: 'material', descricao: '', quantidade_estoque: 0, unidade: '', imagem_url: '' };
  errors.value = {};
};

const saveMaterial = async () => {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingMaterial.value && editingMaterial.value.id) {
      await materialService.update(editingMaterial.value.id, form.value);
      toast.success('Material atualizado com sucesso!');
    } else {
      await materialService.create(form.value);
      toast.success('Material criado com sucesso!');
    }
    closeModal();
    loadMateriais();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar material');
    console.error('Erro ao salvar material:', error);
  }
};

const editMaterial = (material) => {
  openModal(material);
};

const deleteMaterial = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este material?')) {
    return;
  }

  try {
    await materialService.delete(id);
    toast.success('Material excluído com sucesso!');
    loadMateriais();
  } catch (error) {
    toast.error('Erro ao excluir material');
  }
};
</script>

<style scoped>
.materiais-page {
  max-width: 1200px;
}


.materiais-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.material-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.material-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.material-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.material-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-content {
  padding: 1.5rem;
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.material-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.material-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-material {
  background-color: #dbeafe;
  color: #1e40af;
}

.type-ferramenta {
  background-color: #fef3c7;
  color: #92400e;
}

.material-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.material-descricao {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.material-info {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-color);
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
  .materiais-list {
    grid-template-columns: 1fr;
  }
}
</style>

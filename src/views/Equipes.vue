<template>
  <div class="equipes-page">
    <div class="page-header">
      <h1 class="page-title">Equipes</h1>
      <Button @click="openModal">+ Nova Equipe</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="equipes.length === 0" class="empty-state">
      <p>Nenhuma equipe cadastrada. Crie a primeira!</p>
    </div>
    <div v-else class="equipes-list">
      <div v-for="equipe in equipes" :key="equipe.id" class="equipe-card">
        <div class="equipe-header">
          <div>
            <h3>{{ equipe.nome }}</h3>
            <p v-if="equipe.tipo_instalacao_nome" class="equipe-tipo">
              Tipo: {{ equipe.tipo_instalacao_nome }}
            </p>
            <p v-if="equipe.descricao" class="equipe-descricao">{{ equipe.descricao }}</p>
          </div>
          <div class="equipe-actions">
            <button class="btn btn-outline" @click="editEquipe(equipe)">Editar</button>
            <button class="btn btn-danger" @click="deleteEquipe(equipe.id)">Excluir</button>
          </div>
        </div>
        <div class="equipe-funcionarios">
          <h4>Funcionários ({{ equipe.funcionarios?.length || 0 }})</h4>
          <div v-if="equipe.funcionarios && equipe.funcionarios.length > 0" class="funcionarios-list">
            <span
              v-for="func in equipe.funcionarios"
              :key="func.id"
              class="funcionario-badge"
            >
              {{ func.nome }}
            </span>
          </div>
          <p v-else class="empty-funcionarios">Nenhum funcionário na equipe</p>
          <Button @click="openFuncionariosModal(equipe)" class="btn-small">
            Gerenciar Funcionários
          </Button>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingEquipe && editingEquipe.id ? 'Editar Equipe' : 'Nova Equipe'"
      position="right"
      @confirm="saveEquipe"
      @close="closeModal"
    >
      <form @submit.prevent="saveEquipe" class="form">
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome da Equipe *"
          placeholder="Ex: Equipe Alpha"
          :error="errors.nome"
          required
        />
        <div class="input-group">
          <label for="tipo_instalacao_id" class="input-label">Tipo de Instalação</label>
          <select
            id="tipo_instalacao_id"
            v-model="form.tipo_instalacao_id"
            class="input"
          >
            <option :value="null">Selecione...</option>
            <option
              v-for="tipo in tiposInstalacao"
              :key="tipo.id"
              :value="tipo.id"
            >
              {{ tipo.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="descricao" class="input-label">Descrição</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="input"
            rows="3"
            placeholder="Descrição da equipe..."
          ></textarea>
        </div>
        <div class="input-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.ativa" />
            Equipe Ativa
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveEquipe">Salvar</button>
      </template>
    </Offcanvas>

    <Offcanvas
      v-model:show="showFuncionariosModal"
      title="Gerenciar Funcionários da Equipe"
      position="right"
      :show-footer="false"
      @close="closeFuncionariosModal"
    >
      <div v-if="selectedEquipe" class="funcionarios-modal">
        <div class="membros-equipe-section">
          <h4>Membros da Equipe ({{ selectedEquipe.funcionarios?.length || 0 }})</h4>
          <div v-if="selectedEquipe.funcionarios && selectedEquipe.funcionarios.length > 0" class="membros-list">
            <div
              v-for="func in selectedEquipe.funcionarios"
              :key="func.id"
              class="membro-item"
            >
              <div class="membro-info">
                <span class="membro-nome">{{ func.nome }}</span>
                <span class="membro-cargo">{{ func.cargo || 'Sem cargo' }}</span>
              </div>
              <button
                class="btn-remove-membro"
                @click="toggleFuncionario(func.id)"
                title="Remover da equipe"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p v-else class="empty-membros">Nenhum membro na equipe</p>
        </div>

        <div class="divider"></div>

        <div class="funcionarios-disponiveis-section">
          <h4>Funcionários Disponíveis</h4>
          <div class="funcionarios-checkbox-list">
            <label
              v-for="func in funcionariosDisponiveis"
              :key="func.id"
              class="checkbox-item"
            >
              <input
                type="checkbox"
                :value="func.id"
                :checked="isFuncionarioInEquipe(func.id)"
                @change="toggleFuncionario(func.id)"
              />
              <span>{{ func.nome }} - {{ func.cargo || 'Sem cargo' }}</span>
            </label>
          </div>
          <p v-if="funcionariosDisponiveis.length === 0" class="empty-funcionarios-disponiveis">
            Todos os funcionários já estão na equipe
          </p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-primary" @click="closeFuncionariosModal">Fechar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { equipeService } from '../services/equipeService.js';
import { funcionarioService } from '../services/funcionarioService.js';
import { cronogramaService } from '../services/cronogramaService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const equipes = ref([]);
const funcionarios = ref([]);
const tiposInstalacao = ref([]);
const loading = ref(true);
const showModal = ref(false);
const showFuncionariosModal = ref(false);
const editingEquipe = ref(null);
const selectedEquipe = ref(null);
const equipeFuncionarios = ref([]);
const form = ref({
  nome: '',
  tipo_instalacao_id: null,
  descricao: '',
  ativa: true
});
const errors = ref({});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingEquipe.value = null;
    form.value = { nome: '', tipo_instalacao_id: null, descricao: '', ativa: true };
    errors.value = {};
  }
});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    const [equipesData, funcionariosData, tiposData] = await Promise.all([
      equipeService.getAll(),
      funcionarioService.getAll(),
      cronogramaService.getTiposInstalacao()
    ]);
    equipes.value = equipesData;
    funcionarios.value = funcionariosData;
    tiposInstalacao.value = tiposData;
  } catch (error) {
    toast.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const openModal = (equipe = null) => {
  // Limpar estado anterior
  editingEquipe.value = null;
  form.value = { nome: '', tipo_instalacao_id: null, descricao: '', ativa: true };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (equipe && equipe.id) {
    editingEquipe.value = equipe;
    form.value = {
      nome: equipe.nome,
      tipo_instalacao_id: equipe.tipo_instalacao_id,
      descricao: equipe.descricao || '',
      ativa: equipe.ativa
    };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEquipe.value = null;
  form.value = { nome: '', tipo_instalacao_id: null, descricao: '', ativa: true };
  errors.value = {};
};

const saveEquipe = async () => {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingEquipe.value && editingEquipe.value.id) {
      await equipeService.update(editingEquipe.value.id, form.value);
      toast.success('Equipe atualizada com sucesso!');
    } else {
      await equipeService.create(form.value);
      toast.success('Equipe criada com sucesso!');
    }
    closeModal();
    loadData();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar equipe');
    console.error('Erro ao salvar equipe:', error);
  }
};

const editEquipe = (equipe) => {
  openModal(equipe);
};

const deleteEquipe = async (id) => {
  if (!confirm('Tem certeza que deseja excluir esta equipe?')) {
    return;
  }

  try {
    await equipeService.delete(id);
    toast.success('Equipe excluída com sucesso!');
    loadData();
  } catch (error) {
    toast.error('Erro ao excluir equipe');
  }
};

const openFuncionariosModal = (equipe) => {
  selectedEquipe.value = equipe;
  equipeFuncionarios.value = equipe.funcionarios?.map(f => f.id) || [];
  showFuncionariosModal.value = true;
};

const closeFuncionariosModal = () => {
  showFuncionariosModal.value = false;
  selectedEquipe.value = null;
  equipeFuncionarios.value = [];
};

const isFuncionarioInEquipe = (funcionarioId) => {
  return equipeFuncionarios.value.includes(funcionarioId);
};

const funcionariosDisponiveis = computed(() => {
  if (!selectedEquipe.value) return funcionarios.value;
  const membrosIds = selectedEquipe.value.funcionarios?.map(f => f.id) || [];
  return funcionarios.value.filter(func => !membrosIds.includes(func.id));
});

const toggleFuncionario = async (funcionarioId) => {
  const isInEquipe = isFuncionarioInEquipe(funcionarioId);
  const equipeId = selectedEquipe.value.id;
  
  try {
    if (isInEquipe) {
      await equipeService.removeFuncionario(equipeId, funcionarioId);
      equipeFuncionarios.value = equipeFuncionarios.value.filter(id => id !== funcionarioId);
      toast.success('Funcionário removido da equipe');
    } else {
      await equipeService.addFuncionario(equipeId, funcionarioId);
      equipeFuncionarios.value.push(funcionarioId);
      toast.success('Funcionário adicionado à equipe');
    }
    // Recarregar dados e atualizar a equipe selecionada
    await loadData();
    // Atualizar selectedEquipe com os dados atualizados
    const equipeAtualizada = equipes.value.find(e => e.id === equipeId);
    if (equipeAtualizada) {
      selectedEquipe.value = equipeAtualizada;
      equipeFuncionarios.value = equipeAtualizada.funcionarios?.map(f => f.id) || [];
    }
  } catch (error) {
    toast.error('Erro ao atualizar equipe');
  }
};
</script>

<style scoped>
.equipes-page {
  max-width: 1200px;
}


.equipes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.equipe-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
}

.equipe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.equipe-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.equipe-tipo {
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.equipe-descricao {
  font-size: 0.875rem;
  color: var(--text-light);
  margin: 0;
}

.equipe-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.equipe-funcionarios {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.equipe-funcionarios h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.funcionarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.funcionario-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--bg-color);
  border-radius: 9999px;
  font-size: 0.875rem;
}

.empty-funcionarios {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.funcionarios-modal h4 {
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.membros-equipe-section {
  margin-bottom: 1.5rem;
}

.membros-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.membro-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.membro-item:hover {
  background-color: #f3f4f6;
  border-color: var(--primary-color);
}

.membro-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.membro-nome {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9375rem;
}

.membro-cargo {
  font-size: 0.8125rem;
  color: var(--text-light);
}

.btn-remove-membro {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove-membro:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.btn-remove-membro svg {
  width: 1.25rem;
  height: 1.25rem;
}

.empty-membros {
  color: var(--text-light);
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  border: 1px dashed var(--border-color);
}

.divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 1.5rem 0;
}

.funcionarios-disponiveis-section {
  margin-top: 1.5rem;
}

.funcionarios-checkbox-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
}

.checkbox-item:hover {
  background-color: var(--bg-color);
  border-radius: 0.25rem;
}

.empty-funcionarios-disponiveis {
  color: var(--text-light);
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  border: 1px dashed var(--border-color);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .equipes-list {
    grid-template-columns: 1fr;
  }

  .equipe-header {
    flex-direction: column;
  }
}
</style>

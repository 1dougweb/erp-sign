<template>
  <div class="equipamentos-page">
    <div class="page-header">
      <h1 class="page-title">Equipamentos e Ferramentas</h1>
      <Button @click="openModal">+ Novo Equipamento</Button>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-grid">
        <select v-model="filters.tipo" @change="loadEquipamentos" class="input">
          <option value="">Todos os tipos</option>
          <option value="equipamento">Equipamento</option>
          <option value="ferramenta">Ferramenta</option>
        </select>
        <select v-model="filters.status" @change="loadEquipamentos" class="input">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_uso">Em Uso</option>
          <option value="manutencao">Manutenção</option>
          <option value="indisponivel">Indisponível</option>
        </select>
        <Input
          id="busca"
          v-model="filters.busca"
          placeholder="Buscar..."
          @input="loadEquipamentos"
        />
      </div>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="equipamentos.length === 0" class="empty-state">
      <p>Nenhum equipamento encontrado.</p>
    </div>
    <div v-else class="equipamentos-grid">
      <div
        v-for="equipamento in equipamentos"
        :key="equipamento.id"
        class="equipamento-card"
        :class="`status-${equipamento.status}`"
      >
        <div v-if="equipamento.imagem_url" class="equipamento-image">
          <img :src="equipamento.imagem_url" :alt="equipamento.nome" />
        </div>
        <div class="equipamento-content">
          <div class="card-header">
            <div>
              <h3>{{ equipamento.nome }}</h3>
              <span class="tipo-badge" :class="`tipo-${equipamento.tipo}`">
                {{ equipamento.tipo === 'equipamento' ? 'Equipamento' : 'Ferramenta' }}
              </span>
            </div>
            <span class="status-badge" :class="`badge-${equipamento.status}`">
              {{ getStatusLabel(equipamento.status) }}
            </span>
          </div>
          <div class="card-body">
          <div class="info-row" v-if="equipamento.marca">
            <span class="label">Marca:</span>
            <span class="value">{{ equipamento.marca }}</span>
          </div>
          <div class="info-row" v-if="equipamento.modelo">
            <span class="label">Modelo:</span>
            <span class="value">{{ equipamento.modelo }}</span>
          </div>
          <div class="info-row" v-if="equipamento.numero_serie">
            <span class="label">Nº Série:</span>
            <span class="value">{{ equipamento.numero_serie }}</span>
          </div>
          <div class="info-row" v-if="equipamento.patrimonio">
            <span class="label">Patrimônio:</span>
            <span class="value">{{ equipamento.patrimonio }}</span>
          </div>
          <div class="info-row" v-if="equipamento.localizacao">
            <span class="label">Localização:</span>
            <span class="value">{{ equipamento.localizacao }}</span>
          </div>
          </div>
          <div class="card-actions">
          <button class="btn btn-sm btn-outline" @click="viewDetails(equipamento)">
            Detalhes
          </button>
          <button class="btn btn-sm btn-outline" @click="editEquipamento(equipamento)">
            Editar
          </button>
          <button
            v-if="equipamento.status === 'disponivel'"
            class="btn btn-sm btn-primary"
            @click="openEmprestimoModal(equipamento)"
          >
            Emprestar
          </button>
          <button
            v-if="equipamento.status === 'em_uso'"
            class="btn btn-sm btn-success"
            @click="devolverEquipamento(equipamento.id)"
          >
            Devolver
          </button>
          <button class="btn btn-sm btn-danger" @click="deleteEquipamento(equipamento.id)">
            Excluir
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- Offcanvas Equipamento -->
    <Offcanvas
      v-model:show="showModal"
      :title="editingEquipamento && editingEquipamento.id ? 'Editar Equipamento' : 'Novo Equipamento'"
      position="right"
      @confirm="saveEquipamento"
      @close="closeModal"
    >
      <form @submit.prevent="saveEquipamento" class="form">
        <ImageUpload
          v-model="form.imagem_url"
          label="Imagem do Equipamento"
        />
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome *"
          placeholder="Nome do equipamento"
          required
        />
        <div class="input-group">
          <label for="tipo" class="input-label">Tipo *</label>
          <select id="tipo" v-model="form.tipo" class="input" required>
            <option value="">Selecione</option>
            <option value="equipamento">Equipamento</option>
            <option value="ferramenta">Ferramenta</option>
          </select>
        </div>
        <Input
          id="marca"
          v-model="form.marca"
          label="Marca"
          placeholder="Marca"
        />
        <Input
          id="modelo"
          v-model="form.modelo"
          label="Modelo"
          placeholder="Modelo"
        />
        <Input
          id="numero_serie"
          v-model="form.numero_serie"
          label="Nº Série"
          placeholder="Número de série"
        />
        <Input
          id="patrimonio"
          v-model="form.patrimonio"
          label="Patrimônio"
          placeholder="Número de patrimônio"
        />
        <Input
          id="localizacao"
          v-model="form.localizacao"
          label="Localização"
          placeholder="Localização"
        />
        <div class="input-group">
          <label for="status" class="input-label">Status</label>
          <select id="status" v-model="form.status" class="input">
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em Uso</option>
            <option value="manutencao">Manutenção</option>
            <option value="indisponivel">Indisponível</option>
          </select>
        </div>
        <div class="input-group">
          <label for="valor_aquisicao" class="input-label">Valor de Aquisição</label>
          <input
            type="number"
            id="valor_aquisicao"
            v-model.number="form.valor_aquisicao"
            class="input"
            min="0"
            step="0.01"
          />
        </div>
        <div class="input-group">
          <label for="data_aquisicao" class="input-label">Data de Aquisição</label>
          <input
            type="date"
            id="data_aquisicao"
            v-model="form.data_aquisicao"
            class="input"
          />
        </div>
        <div class="input-group">
          <label for="observacoes" class="input-label">Observações</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="input"
            rows="3"
            placeholder="Observações..."
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveEquipamento">Salvar</button>
      </template>
    </Offcanvas>

    <!-- Offcanvas Empréstimo -->
    <Offcanvas
      v-model:show="showEmprestimoModal"
      title="Emprestar Equipamento"
      position="right"
      @confirm="processarEmprestimo"
      @close="closeEmprestimoModal"
    >
      <div v-if="equipamentoSelecionado">
        <p><strong>Equipamento:</strong> {{ equipamentoSelecionado.nome }}</p>
        <div class="input-group">
          <label for="funcionario_id" class="input-label">Funcionário</label>
          <select id="funcionario_id" v-model="emprestimoForm.funcionario_id" class="input">
            <option value="">Selecione funcionário</option>
            <option v-for="func in funcionarios" :key="func.id" :value="func.id">
              {{ func.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="data_prevista_devolucao" class="input-label">Data Prevista de Devolução</label>
          <input
            type="date"
            id="data_prevista_devolucao"
            v-model="emprestimoForm.data_prevista_devolucao"
            class="input"
          />
        </div>
        <div class="input-group">
          <label for="observacoes_emprestimo" class="input-label">Observações</label>
          <textarea
            id="observacoes_emprestimo"
            v-model="emprestimoForm.observacoes"
            class="input"
            rows="2"
            placeholder="Observações sobre o empréstimo..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeEmprestimoModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="processarEmprestimo">Confirmar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { equipamentoService } from '../services/equipamentoService.js';
import { funcionarioService } from '../services/funcionarioService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Loading from '../components/common/Loading.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import ImageUpload from '../components/common/ImageUpload.vue';

const toast = useToast();

const loading = ref(false);
const equipamentos = ref([]);
const funcionarios = ref([]);
const filters = ref({
  tipo: '',
  status: '',
  busca: ''
});
const showModal = ref(false);
const showEmprestimoModal = ref(false);
const editingEquipamento = ref(null);
const equipamentoSelecionado = ref(null);
const form = ref({
  nome: '',
  descricao: '',
  tipo: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  patrimonio: '',
  localizacao: '',
  status: 'disponivel',
  valor_aquisicao: 0,
  data_aquisicao: '',
  observacoes: '',
  imagem_url: ''
});
const emprestimoForm = ref({
  funcionario_id: '',
  data_prevista_devolucao: '',
  observacoes: ''
});

const loadEquipamentos = async () => {
  loading.value = true;
  try {
    const data = await equipamentoService.getAll(filters.value);
    equipamentos.value = data;
  } catch (error) {
    toast.error('Erro ao carregar equipamentos');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadFuncionarios = async () => {
  try {
    const data = await funcionarioService.getAll();
    funcionarios.value = data;
  } catch (error) {
    console.error('Erro ao carregar funcionários:', error);
  }
};

const openModal = () => {
  editingEquipamento.value = null;
  form.value = {
    nome: '',
    descricao: '',
    tipo: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    patrimonio: '',
    localizacao: '',
    status: 'disponivel',
    valor_aquisicao: 0,
    data_aquisicao: '',
    observacoes: '',
    imagem_url: ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEquipamento.value = null;
};

const editEquipamento = (equipamento) => {
  editingEquipamento.value = equipamento;
  form.value = {
    nome: equipamento.nome || '',
    descricao: equipamento.descricao || '',
    tipo: equipamento.tipo || '',
    marca: equipamento.marca || '',
    modelo: equipamento.modelo || '',
    numero_serie: equipamento.numero_serie || '',
    patrimonio: equipamento.patrimonio || '',
    localizacao: equipamento.localizacao || '',
    status: equipamento.status || 'disponivel',
    valor_aquisicao: equipamento.valor_aquisicao || 0,
    data_aquisicao: equipamento.data_aquisicao || '',
    observacoes: equipamento.observacoes || '',
    imagem_url: equipamento.imagem_url || ''
  };
  showModal.value = true;
};

const saveEquipamento = async () => {
  try {
    if (editingEquipamento.value && editingEquipamento.value.id) {
      await equipamentoService.update(editingEquipamento.value.id, form.value);
      toast.success('Equipamento atualizado com sucesso!');
    } else {
      await equipamentoService.create(form.value);
      toast.success('Equipamento criado com sucesso!');
    }
    closeModal();
    loadEquipamentos();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar equipamento');
  }
};

const deleteEquipamento = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
  try {
    await equipamentoService.delete(id);
    toast.success('Equipamento excluído com sucesso!');
    loadEquipamentos();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao excluir equipamento');
  }
};

const openEmprestimoModal = (equipamento) => {
  equipamentoSelecionado.value = equipamento;
  emprestimoForm.value = {
    funcionario_id: '',
    data_prevista_devolucao: '',
    observacoes: ''
  };
  showEmprestimoModal.value = true;
};

const closeEmprestimoModal = () => {
  showEmprestimoModal.value = false;
  equipamentoSelecionado.value = null;
};

const processarEmprestimo = async () => {
  try {
    await equipamentoService.emprestar(equipamentoSelecionado.value.id, emprestimoForm.value);
    toast.success('Equipamento emprestado com sucesso!');
    closeEmprestimoModal();
    loadEquipamentos();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao emprestar equipamento');
  }
};

const devolverEquipamento = async (id) => {
  if (!confirm('Confirmar devolução do equipamento?')) return;
  try {
    await equipamentoService.devolver(id, {});
    toast.success('Equipamento devolvido com sucesso!');
    loadEquipamentos();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao devolver equipamento');
  }
};

const viewDetails = (equipamento) => {
  // TODO: Implementar modal de detalhes
  toast.info(`Detalhes de ${equipamento.nome}`);
};

const getStatusLabel = (status) => {
  const labels = {
    disponivel: 'Disponível',
    em_uso: 'Em Uso',
    manutencao: 'Manutenção',
    indisponivel: 'Indisponível'
  };
  return labels[status] || status;
};

onMounted(() => {
  loadEquipamentos();
  loadFuncionarios();
});
</script>

<style scoped>
.equipamentos-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 1rem;
}

.equipamentos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.equipamento-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.equipamento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.equipamento-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.equipamento-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equipamento-content {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.tipo-badge {
  display: inline-block;
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-disponivel {
  background: #d1fae5;
  color: #059669;
}

.badge-em_uso {
  background: #dbeafe;
  color: #2563eb;
}

.badge-manutencao {
  background: #fef3c7;
  color: #d97706;
}

.badge-indisponivel {
  background: #fee2e2;
  color: #dc2626;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-row .value {
  font-weight: 500;
  color: #111827;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .equipamentos-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="requisicoes-page">
    <div class="page-header">
      <h1 class="page-title">Requisições de Materiais</h1>
      <Button @click="openModal">+ Nova Requisição</Button>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <select v-model="filters.status" @change="loadRequisicoes" class="input">
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="aprovada">Aprovada</option>
        <option value="atendida">Atendida</option>
        <option value="rejeitada">Rejeitada</option>
        <option value="cancelada">Cancelada</option>
      </select>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="requisicoes.length === 0" class="empty-state">
      <p>Nenhuma requisição encontrada.</p>
    </div>
    <div v-else class="requisicoes-list">
      <div
        v-for="requisicao in requisicoes"
        :key="requisicao.id"
        class="requisicao-card"
        :class="`status-${requisicao.status}`"
      >
        <div class="card-header">
          <div>
            <h3>{{ requisicao.numero }}</h3>
            <span class="status-badge" :class="`badge-${requisicao.status}`">
              {{ getStatusLabel(requisicao.status) }}
            </span>
          </div>
          <div class="card-actions">
            <button
              class="btn btn-sm btn-outline"
              @click="viewDetails(requisicao)"
            >
              Ver Detalhes
            </button>
            <button
              v-if="authStore.isAdmin && requisicao.status === 'pendente'"
              class="btn btn-sm btn-primary"
              @click="openAprovacaoModal(requisicao)"
            >
              Aprovar/Rejeitar
            </button>
            <button
              v-if="!authStore.isAdmin && requisicao.status === 'pendente'"
              class="btn btn-sm btn-danger"
              @click="cancelarRequisicao(requisicao.id)"
            >
              Cancelar
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Solicitante:</span>
            <span class="value">{{ requisicao.solicitante_nome }}</span>
          </div>
          <div class="info-row" v-if="requisicao.aprovador_nome">
            <span class="label">Aprovador:</span>
            <span class="value">{{ requisicao.aprovador_nome }}</span>
          </div>
          <div class="info-row" v-if="requisicao.projeto_nome">
            <span class="label">Projeto:</span>
            <span class="value">{{ requisicao.projeto_nome }}</span>
          </div>
          <div class="info-row" v-if="requisicao.orcamento_numero">
            <span class="label">Orçamento:</span>
            <span class="value">{{ requisicao.orcamento_numero }}</span>
          </div>
          <div class="info-row">
            <span class="label">Data:</span>
            <span class="value">{{ formatDate(requisicao.data_solicitacao) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Itens:</span>
            <span class="value">{{ requisicao.itens?.length || 0 }} item(ns)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Offcanvas Nova Requisição -->
    <Offcanvas
      v-model:show="showModal"
      :title="'Nova Requisição'"
      position="right"
      @confirm="saveRequisicao"
      @close="closeModal"
    >
      <form @submit.prevent="saveRequisicao" class="form">
        <div class="input-group">
          <label for="projeto_id" class="input-label">Projeto (opcional)</label>
          <select id="projeto_id" v-model="form.projeto_id" class="input">
            <option value="">Selecione um projeto</option>
            <option v-for="proj in projetos" :key="proj.id" :value="proj.id">
              {{ proj.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="orcamento_id" class="input-label">Orçamento (opcional)</label>
          <select id="orcamento_id" v-model="form.orcamento_id" class="input">
            <option value="">Selecione um orçamento</option>
            <option v-for="orc in orcamentos" :key="orc.id" :value="orc.id">
              {{ orc.numero }} - {{ orc.cliente_nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="cronograma_id" class="input-label">Cronograma (opcional)</label>
          <select id="cronograma_id" v-model="form.cronograma_id" class="input">
            <option value="">Selecione um cronograma</option>
            <option v-for="cron in cronogramas" :key="cron.id" :value="cron.id">
              {{ formatDate(cron.data_instalacao) }} - {{ cron.endereco }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="justificativa" class="input-label">Justificativa *</label>
          <textarea
            id="justificativa"
            v-model="form.justificativa"
            class="input"
            rows="3"
            required
            placeholder="Descreva a justificativa para esta requisição..."
          ></textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Itens da Requisição *</label>
          <div v-for="(item, index) in form.itens" :key="index" class="item-row">
            <select v-model="item.material_id" class="input" required>
              <option value="">Selecione material</option>
              <option v-for="mat in materiais" :key="mat.id" :value="mat.id">
                {{ mat.nome }}
              </option>
            </select>
            <input
              type="number"
              v-model.number="item.quantidade_solicitada"
              class="input"
              placeholder="Qtd"
              min="0.01"
              step="0.01"
              required
            />
            <select v-model="item.unidade_id" class="input">
              <option value="">Unidade</option>
              <option v-for="un in unidades" :key="un.id" :value="un.id">
                {{ un.simbolo }}
              </option>
            </select>
            <textarea
              v-model="item.justificativa_item"
              class="input"
              rows="2"
              placeholder="Justificativa do item..."
            ></textarea>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              @click="removeItem(index)"
              v-if="form.itens.length > 1"
            >
              Remover
            </button>
          </div>
          <button type="button" class="btn btn-outline" @click="addItem">
            + Adicionar Item
          </button>
        </div>
        <div class="input-group">
          <label for="observacoes" class="input-label">Observações</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="input"
            rows="2"
            placeholder="Observações adicionais..."
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveRequisicao">Salvar</button>
      </template>
    </Offcanvas>

    <!-- Offcanvas Aprovação -->
    <Offcanvas
      v-model:show="showAprovacaoModal"
      :title="'Aprovar/Rejeitar Requisição'"
      position="right"
      @confirm="processarAprovacao"
      @close="closeAprovacaoModal"
    >
      <div v-if="requisicaoSelecionada">
        <p><strong>Número:</strong> {{ requisicaoSelecionada.numero }}</p>
        <p><strong>Solicitante:</strong> {{ requisicaoSelecionada.solicitante_nome }}</p>
        <p><strong>Justificativa:</strong> {{ requisicaoSelecionada.justificativa }}</p>
        <div class="input-group">
          <label class="checkbox-label">
            <input type="radio" v-model="aprovacaoData.aprovado" :value="true" />
            Aprovar
          </label>
          <label class="checkbox-label">
            <input type="radio" v-model="aprovacaoData.aprovado" :value="false" />
            Rejeitar
          </label>
        </div>
        <div class="input-group">
          <label for="observacoes_aprovacao" class="input-label">Observações</label>
          <textarea
            id="observacoes_aprovacao"
            v-model="aprovacaoData.observacoes"
            class="input"
            rows="3"
            placeholder="Observações sobre a aprovação/rejeição..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeAprovacaoModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="processarAprovacao">Confirmar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../store/auth.js';
import { requisicaoService } from '../services/requisicaoService.js';
import { estoqueService, unidadeMedidaService } from '../services/estoqueService.js';
import { projetoService } from '../services/projetoService.js';
import { orcamentoService } from '../services/orcamentoService.js';
import { cronogramaService } from '../services/cronogramaService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Loading from '../components/common/Loading.vue';
import Button from '../components/common/Button.vue';

const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const requisicoes = ref([]);
const materiais = ref([]);
const unidades = ref([]);
const projetos = ref([]);
const orcamentos = ref([]);
const cronogramas = ref([]);
const filters = ref({ status: '' });
const showModal = ref(false);
const showAprovacaoModal = ref(false);
const requisicaoSelecionada = ref(null);
const aprovacaoData = ref({ aprovado: true, observacoes: '' });
const form = ref({
  projeto_id: '',
  orcamento_id: '',
  cronograma_id: '',
  justificativa: '',
  observacoes: '',
  itens: [{ material_id: '', quantidade_solicitada: 0, unidade_id: '', justificativa_item: '' }]
});

const loadRequisicoes = async () => {
  loading.value = true;
  try {
    const data = await requisicaoService.getAll(filters.value);
    requisicoes.value = data;
  } catch (error) {
    toast.error('Erro ao carregar requisições');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadMateriais = async () => {
  try {
    const data = await estoqueService.getAll();
    materiais.value = data;
  } catch (error) {
    console.error('Erro ao carregar materiais:', error);
  }
};

const loadUnidades = async () => {
  try {
    const data = await unidadeMedidaService.getAll();
    unidades.value = data;
  } catch (error) {
    console.error('Erro ao carregar unidades:', error);
  }
};

const loadProjetos = async () => {
  try {
    const data = await projetoService.getAll();
    projetos.value = data;
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
  }
};

const loadOrcamentos = async () => {
  try {
    const data = await orcamentoService.getAll();
    orcamentos.value = data;
  } catch (error) {
    console.error('Erro ao carregar orçamentos:', error);
  }
};

const loadCronogramas = async () => {
  try {
    const data = await cronogramaService.getAll();
    cronogramas.value = data;
  } catch (error) {
    console.error('Erro ao carregar cronogramas:', error);
  }
};

const openModal = () => {
  form.value = {
    projeto_id: '',
    orcamento_id: '',
    cronograma_id: '',
    justificativa: '',
    observacoes: '',
    itens: [{ material_id: '', quantidade_solicitada: 0, unidade_id: '', justificativa_item: '' }]
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const addItem = () => {
  form.value.itens.push({ material_id: '', quantidade_solicitada: 0, unidade_id: '', justificativa_item: '' });
};

const removeItem = (index) => {
  form.value.itens.splice(index, 1);
};

const saveRequisicao = async () => {
  try {
    await requisicaoService.create(form.value);
    toast.success('Requisição criada com sucesso!');
    closeModal();
    loadRequisicoes();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao criar requisição');
  }
};

const openAprovacaoModal = (requisicao) => {
  requisicaoSelecionada.value = requisicao;
  aprovacaoData.value = { aprovado: true, observacoes: '' };
  showAprovacaoModal.value = true;
};

const closeAprovacaoModal = () => {
  showAprovacaoModal.value = false;
  requisicaoSelecionada.value = null;
};

const processarAprovacao = async () => {
  try {
    await requisicaoService.aprovar(requisicaoSelecionada.value.id, aprovacaoData.value);
    toast.success(aprovacaoData.value.aprovado ? 'Requisição aprovada!' : 'Requisição rejeitada!');
    closeAprovacaoModal();
    loadRequisicoes();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao processar aprovação');
  }
};

const cancelarRequisicao = async (id) => {
  if (!confirm('Tem certeza que deseja cancelar esta requisição?')) return;
  try {
    await requisicaoService.cancelar(id);
    toast.success('Requisição cancelada!');
    loadRequisicoes();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao cancelar requisição');
  }
};

const viewDetails = (requisicao) => {
  // TODO: Implementar modal de detalhes
  toast.info(`Detalhes da requisição ${requisicao.numero}`);
};

const getStatusLabel = (status) => {
  const labels = {
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    atendida: 'Atendida',
    rejeitada: 'Rejeitada',
    cancelada: 'Cancelada'
  };
  return labels[status] || status;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

onMounted(() => {
  loadRequisicoes();
  loadMateriais();
  loadUnidades();
  loadProjetos();
  loadOrcamentos();
  loadCronogramas();
});
</script>

<style scoped>
.requisicoes-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-section {
  margin-bottom: 2rem;
}

.requisicoes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.requisicao-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-pendente {
  background: #fef3c7;
  color: #d97706;
}

.badge-aprovada {
  background: #d1fae5;
  color: #059669;
}

.badge-atendida {
  background: #dbeafe;
  color: #2563eb;
}

.badge-rejeitada {
  background: #fee2e2;
  color: #dc2626;
}

.badge-cancelada {
  background: #e5e7eb;
  color: #6b7280;
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

.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}
</style>

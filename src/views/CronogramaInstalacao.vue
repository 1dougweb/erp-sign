<template>
  <div class="cronograma-page">
    <div class="page-header">
      <h1 class="page-title">Cronograma de Instalação</h1>
      <Button @click="openModal">+ Novo Cronograma</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="cronogramas.length === 0" class="empty-state">
      <p>Nenhum cronograma cadastrado. Crie o primeiro!</p>
    </div>
    <div v-else class="cronogramas-list">
      <!-- Mapa com pins dos cronogramas ativos -->
      <div v-if="cronogramas.length > 0" class="mapa-section">
        <div class="mapa-header">
          <h3>Mapa de Instalações Ativas</h3>
          <p v-if="cronogramasAtivosComCoordenadas.length === 0" class="mapa-aviso">
            Nenhum cronograma ativo possui coordenadas. Use o campo de endereço com Google Maps para adicionar coordenadas automaticamente.
            <span v-if="cronogramas.filter(c => c.status === 'concluido').length > 0">
              ({{ cronogramas.filter(c => c.status === 'concluido').length }} cronograma(s) concluído(s) não são exibidos no mapa, mas permanecem no histórico)
            </span>
          </p>
        </div>
        <GoogleMapsView
          :cronogramas="cronogramasAtivosComCoordenadas"
          @cronograma-selected="onCronogramaSelected"
          @edit-cronograma="editCronograma"
        />
      </div>

      <!-- Ordenar cronogramas: ativos primeiro, depois concluídos -->
      <div 
        v-for="cronograma in cronogramasOrdenados" 
        :key="cronograma.id" 
        class="cronograma-card"
        :class="{ 'cronograma-concluido': cronograma.status === 'concluido' }"
      >
        <div 
          class="cronograma-header clickable" 
          @click="toggleCronograma(cronograma.id)"
        >
          <div class="cronograma-header-left">
            <button class="btn-collapse" type="button">
              <ChevronDownIcon 
                v-if="expandedCronogramas.has(cronograma.id)"
                class="icon-collapse"
              />
              <ChevronRightIcon 
                v-else
                class="icon-collapse"
              />
            </button>
            <div>
              <h3>
                {{ cronograma.os_manual ? `OS ${cronograma.os_manual}` : 'Cronograma #' + cronograma.id }}
                <span v-if="cronograma.status === 'concluido'" class="badge-concluido">✓ Concluído</span>
              </h3>
              <p class="cronograma-data">
                📅 {{ formatDate(cronograma.data_instalacao) }}
                <span v-if="cronograma.data_termino">
                  - {{ formatDate(cronograma.data_termino) }}
                </span>
                <span v-if="cronograma.hora_inicio">
                  às {{ cronograma.hora_inicio }}
                </span>
              </p>
            </div>
          </div>
          <div class="cronograma-actions" @click.stop>
            <span :class="['status-badge', getStatusClass(cronograma.status)]">
              {{ getStatusLabel(cronograma.status) }}
            </span>
            <button class="btn btn-outline" @click="editCronograma(cronograma)">Editar</button>
            <button class="btn btn-danger" @click="deleteCronograma(cronograma.id)">Excluir</button>
          </div>
        </div>
        <Transition name="collapse">
          <div v-if="expandedCronogramas.has(cronograma.id)" class="cronograma-info">
            <p><strong>Endereço:</strong> {{ cronograma.endereco }}</p>
            <div v-if="cronograma.equipes && cronograma.equipes.length > 0" class="cronograma-section">
              <strong>Equipes:</strong>
              <div class="tags-list">
                <span v-for="equipe in cronograma.equipes" :key="equipe.id" class="tag">
                  {{ equipe.nome }}
                </span>
              </div>
            </div>
            <div v-if="cronograma.materiais && cronograma.materiais.length > 0" class="cronograma-section">
              <ChecklistMaterial
                :cronograma-id="cronograma.id"
                :materiais="cronograma.materiais"
                @update="loadData"
              />
            </div>
            <div v-if="cronograma.equipamentos && cronograma.equipamentos.length > 0" class="cronograma-section">
              <strong>Equipamentos:</strong>
              <div class="tags-list">
                <span v-for="equipamento in cronograma.equipamentos" :key="equipamento.id" class="tag">
                  {{ equipamento.nome }}
                  <span v-if="equipamento.tipo" class="tag-subtitle">
                    ({{ equipamento.tipo === 'equipamento' ? 'Equipamento' : 'Ferramenta' }})
                  </span>
                </span>
              </div>
            </div>
            <div v-if="cronograma.observacoes" class="cronograma-section">
              <strong>Observações:</strong> {{ cronograma.observacoes }}
            </div>
            <div v-if="cronograma.id" class="cronograma-section">
              <CronogramaTodoList
                :cronograma-id="cronograma.id"
              />
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingCronograma && editingCronograma.id ? 'Editar Cronograma' : 'Novo Cronograma'"
      position="right"
      @confirm="saveCronograma"
      @close="closeModal"
    >
      <form @submit.prevent="saveCronograma" class="form">
        <Input
          id="os_manual"
          v-model="form.os_manual"
          label="OS (Ordem de Serviço)"
          placeholder="Ex: OS-2024-001"
          :error="errors.os_manual"
        />
        <div class="form-row">
          <Input
            id="data_instalacao"
            v-model="form.data_instalacao"
            label="Data de Início"
            type="date"
            :error="errors.data_instalacao"
            required
          />
          <Input
            id="data_termino"
            v-model="form.data_termino"
            label="Data de Término"
            type="date"
            :error="errors.data_termino"
          />
        </div>
        <div class="form-row">
          <Input
            id="hora_inicio"
            v-model="form.hora_inicio"
            label="Hora Início"
            type="time"
          />
          <Input
            id="hora_fim"
            v-model="form.hora_fim"
            label="Hora Fim"
            type="time"
          />
        </div>
        <GoogleMapsAutocomplete
          id="endereco"
          v-model="form.endereco"
          v-model:cep="form.cep"
          :latitude="form.latitude ? Number(form.latitude) : null"
          :longitude="form.longitude ? Number(form.longitude) : null"
          @update:latitude="(val) => form.latitude = val !== null && val !== undefined ? Number(val) : null"
          @update:longitude="(val) => form.longitude = val !== null && val !== undefined ? Number(val) : null"
          label="Endereço"
          placeholder="Digite o endereço ou CEP"
          :error="errors.endereco"
          required
        />
        <EquipeSearch
          id="equipes"
          v-model="selectedEquipes"
          :equipes="equipes"
          label="Equipes"
          placeholder="Pesquise por nome da equipe..."
        />
        <div class="input-group">
          <label for="materiais" class="input-label">Materiais</label>
          <div class="materiais-grid">
            <div
              v-for="material in materiais"
              :key="material.id"
              class="material-card"
              :class="{ 'material-selected': selectedMateriais.includes(material.id) }"
            >
              <label class="material-card-label">
                <input
                  type="checkbox"
                  :value="material.id"
                  v-model="selectedMateriais"
                  class="material-checkbox"
                />
                <div class="material-card-content">
                  <div v-if="material.imagem_url && selectedMateriais.includes(material.id)" class="material-image-container">
                    <img :src="material.imagem_url" :alt="material.nome" class="material-image" />
                  </div>
                  <div v-else-if="material.imagem_url" class="material-image-thumbnail">
                    <img :src="material.imagem_url" :alt="material.nome" class="material-thumbnail" />
                  </div>
                  <div v-else class="material-image-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div class="material-info">
                    <div class="material-nome">{{ material.nome }}</div>
                    <div v-if="material.descricao && selectedMateriais.includes(material.id)" class="material-descricao">
                      {{ material.descricao }}
                    </div>
                    <div v-if="selectedMateriais.includes(material.id)" class="material-quantidade-input">
                      <label class="qtd-label">Quantidade:</label>
                      <Input
                        v-model.number="materialQuantidades[material.id]"
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        class="qtd-input"
                      />
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          <p v-if="materiais.length === 0" class="empty-message">
            Nenhum material cadastrado. Cadastre materiais primeiro.
          </p>
        </div>
        <VeiculoSearch
          id="veiculos"
          v-model="selectedVeiculos"
          :veiculos="carros"
          label="Veículos"
          placeholder="Pesquise por placa, modelo ou marca..."
        />
        <div class="input-group">
          <label for="equipamentos" class="input-label">Equipamentos</label>
          <div class="equipamentos-select">
            <div
              v-for="equipamento in equipamentos"
              :key="equipamento.id"
              class="equipamento-select-item"
            >
              <label>
                <input
                  type="checkbox"
                  :value="equipamento.id"
                  v-model="selectedEquipamentos"
                />
                {{ equipamento.nome }}
                <span v-if="equipamento.tipo" class="equipamento-tipo">
                  ({{ equipamento.tipo === 'equipamento' ? 'Equipamento' : 'Ferramenta' }})
                </span>
              </label>
            </div>
          </div>
          <p v-if="equipamentos.length === 0" class="empty-message">
            Nenhum equipamento cadastrado. Cadastre equipamentos primeiro.
          </p>
        </div>
        <div class="input-group">
          <label for="status" class="input-label">Status</label>
          <select id="status" v-model="form.status" class="input">
            <option value="agendado">Agendado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="input-group">
          <label for="observacoes" class="input-label">Observações</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="textarea"
            rows="3"
          ></textarea>
        </div>
        <div v-if="editingCronograma && editingCronograma.id" class="input-group">
          <CronogramaTodoList
            :cronograma-id="editingCronograma.id"
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveCronograma">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { cronogramaService } from '../services/cronogramaService.js';
import { equipeService } from '../services/equipeService.js';
import { materialService } from '../services/materialService.js';
import { carroService } from '../services/carroService.js';
import { equipamentoService } from '../services/equipamentoService.js';
import ChecklistMaterial from '../components/instalacao/ChecklistMaterial.vue';
import CronogramaTodoList from '../components/cronograma/CronogramaTodoList.vue';
import GoogleMapsAutocomplete from '../components/maps/GoogleMapsAutocomplete.vue';
import GoogleMapsView from '../components/maps/GoogleMapsView.vue';
import VeiculoSearch from '../components/cronograma/VeiculoSearch.vue';
import EquipeSearch from '../components/cronograma/EquipeSearch.vue';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const cronogramas = ref([]);
const equipes = ref([]);
const materiais = ref([]);
const carros = ref([]);
const equipamentos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingCronograma = ref(null);
const selectedMateriais = ref([]);
const materialQuantidades = ref({});
const selectedVeiculos = ref([]);
const selectedEquipes = ref([]);
const selectedEquipamentos = ref([]);
const expandedCronogramas = ref(new Set());
const form = ref({
  os_manual: '',
  data_instalacao: '',
  data_termino: '',
  hora_inicio: '',
  hora_fim: '',
  endereco: '',
  cep: '',
  latitude: null,
  longitude: null,
  observacoes: '',
  status: 'agendado',
  equipes: []
});
const errors = ref({});

// Cronogramas ativos (não concluídos) com coordenadas para mostrar no mapa
const cronogramasAtivosComCoordenadas = computed(() => {
  return cronogramas.value.filter(c => 
    c.latitude && 
    c.longitude && 
    c.status !== 'concluido'
  );
});

// Ordenar cronogramas: ativos primeiro, depois concluídos
const cronogramasOrdenados = computed(() => {
  return [...cronogramas.value].sort((a, b) => {
    // Cronogramas concluídos vão para o final
    if (a.status === 'concluido' && b.status !== 'concluido') return 1;
    if (a.status !== 'concluido' && b.status === 'concluido') return -1;
    
    // Dentro do mesmo grupo, ordenar por data de instalação (mais recente primeiro)
    const dateA = new Date(a.data_instalacao);
    const dateB = new Date(b.data_instalacao);
    return dateB - dateA;
  });
});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingCronograma.value = null;
    form.value = {
      os_manual: '',
      data_instalacao: '',
      data_termino: '',
      hora_inicio: '',
      hora_fim: '',
      endereco: '',
      cep: '',
      latitude: null,
      longitude: null,
      observacoes: '',
      status: 'agendado',
      equipes: []
    };
    selectedMateriais.value = [];
    materialQuantidades.value = {};
    selectedVeiculos.value = [];
    selectedEquipes.value = [];
    selectedEquipamentos.value = [];
    errors.value = {};
  }
});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    const [cronogramasData, equipesData, materiaisData, carrosData, equipamentosData] = await Promise.all([
      cronogramaService.getAll(),
      equipeService.getAll(),
      materialService.getAll(),
      carroService.getAll(),
      equipamentoService.getAll()
    ]);
    cronogramas.value = cronogramasData;
    equipes.value = equipesData;
    materiais.value = materiaisData;
    carros.value = carrosData;
    equipamentos.value = equipamentosData;
  } catch (error) {
    toast.error('Erro ao carregar dados');
    console.error('Erro ao carregar dados:', error);
  } finally {
    loading.value = false;
  }
};

const onCronogramaSelected = (cronograma) => {
  // Pode ser usado para ações adicionais quando um cronograma é selecionado no mapa
  console.log('Cronograma selecionado:', cronograma);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Se já estiver no formato brasileiro (DD/MM/YYYY), retornar como está
  if (typeof dateString === 'string' && dateString.includes('/')) {
    return dateString;
  }
  
  // Tentar criar Date object
  let date;
  try {
    // Se for formato YYYY-MM-DD (sem hora), adicionar hora para evitar problemas de timezone
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      date = new Date(dateString + 'T12:00:00');
    } else {
      date = new Date(dateString);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return dateString; // Retornar string original se não conseguir converter
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error);
    return dateString; // Retornar string original em caso de erro
  }
};

const getStatusLabel = (status) => {
  const labels = {
    agendado: 'Agendado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    agendado: 'status-scheduled',
    em_andamento: 'status-in-progress',
    concluido: 'status-completed',
    cancelado: 'status-cancelled'
  };
  return classes[status] || '';
};

const openModal = (cronograma = null) => {
  // Limpar estado anterior
  editingCronograma.value = null;
  form.value = {
    os_manual: '',
    data_instalacao: '',
    data_termino: '',
    hora_inicio: '',
    hora_fim: '',
    endereco: '',
    cep: '',
    latitude: null,
    longitude: null,
    observacoes: '',
    status: 'agendado',
    equipes: []
  };
    selectedMateriais.value = [];
    materialQuantidades.value = {};
    selectedVeiculos.value = [];
    selectedEquipes.value = [];
    errors.value = {};
  
  // Se for edição, preencher os dados
  if (cronograma && cronograma.id) {
    editingCronograma.value = cronograma;
    
    // Função auxiliar para formatar data para input (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      // Se já estiver no formato YYYY-MM-DD, retornar apenas a parte da data
      if (typeof dateString === 'string') {
        // Se tiver hora (formato ISO), pegar apenas a data
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        // Se já estiver no formato YYYY-MM-DD, retornar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
      }
      // Tentar converter de outros formatos
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.warn('Erro ao formatar data para input:', dateString);
      }
      return dateString;
    };
    
    form.value = {
      os_manual: cronograma.os_manual || '',
      data_instalacao: formatDateForInput(cronograma.data_instalacao),
      data_termino: formatDateForInput(cronograma.data_termino) || '',
      hora_inicio: cronograma.hora_inicio || '',
      hora_fim: cronograma.hora_fim || '',
      endereco: cronograma.endereco,
      cep: cronograma.cep || '',
      latitude: cronograma.latitude ? Number(cronograma.latitude) : null,
      longitude: cronograma.longitude ? Number(cronograma.longitude) : null,
      observacoes: cronograma.observacoes || '',
      status: cronograma.status,
      equipes: []
    };
    selectedMateriais.value = cronograma.materiais?.map(m => m.id) || [];
    cronograma.materiais?.forEach(m => {
      materialQuantidades.value[m.id] = m.quantidade_necessaria;
    });
    // Carregar veículos do cronograma
    selectedVeiculos.value = cronograma.carros || [];
    // Carregar equipes do cronograma (com funcionários)
    selectedEquipes.value = cronograma.equipes || [];
    // Carregar equipamentos do cronograma
    selectedEquipamentos.value = cronograma.equipamentos?.map(e => e.id) || [];
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingCronograma.value = null;
  form.value = {
    os_manual: '',
    data_instalacao: '',
    data_termino: '',
    hora_inicio: '',
    hora_fim: '',
    endereco: '',
    cep: '',
    latitude: null,
    longitude: null,
    observacoes: '',
    status: 'agendado',
    equipes: []
  };
  selectedMateriais.value = [];
  materialQuantidades.value = {};
  selectedVeiculos.value = [];
  selectedEquipes.value = [];
  selectedEquipamentos.value = [];
  errors.value = {};
};

const saveCronograma = async () => {
  if (!form.value.data_instalacao) {
    errors.value.data_instalacao = 'Data é obrigatória';
    return;
  }
  if (!form.value.endereco.trim()) {
    errors.value.endereco = 'Endereço é obrigatório';
    return;
  }

  try {
    const materiaisData = selectedMateriais.value.map(id => ({
      material_id: id,
      quantidade_necessaria: materialQuantidades.value[id] || 1
    }));

    const cronogramaData = {
      ...form.value,
      materiais: materiaisData,
      veiculos: selectedVeiculos.value.map(v => v.id),
      equipes: selectedEquipes.value.map(e => e.id),
      equipamentos: selectedEquipamentos.value
    };

    // Verificar se é edição (deve ter id válido)
    if (editingCronograma.value && editingCronograma.value.id) {
      await cronogramaService.update(editingCronograma.value.id, cronogramaData);
      toast.success('Cronograma atualizado com sucesso!');
    } else {
      await cronogramaService.create(cronogramaData);
      toast.success('Cronograma criado com sucesso!');
    }
    closeModal();
    loadData();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar cronograma');
    console.error('Erro ao salvar cronograma:', error);
  }
};

const toggleCronograma = (cronogramaId) => {
  if (expandedCronogramas.value.has(cronogramaId)) {
    expandedCronogramas.value.delete(cronogramaId);
  } else {
    expandedCronogramas.value.add(cronogramaId);
  }
};

const editCronograma = (cronograma) => {
  openModal(cronograma);
};

const deleteCronograma = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este cronograma?')) {
    return;
  }

  try {
    await cronogramaService.delete(id);
    toast.success('Cronograma excluído com sucesso!');
    loadData();
  } catch (error) {
    toast.error('Erro ao excluir cronograma');
  }
};
</script>

<style scoped>
.cronograma-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.cronogramas-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cronograma-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
}

.cronograma-card.cronograma-concluido {
  opacity: 0.7;
  background-color: #f9fafb;
  border-left: 4px solid #10b981;
}

.cronograma-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 0rem;

}

.cronograma-header.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0.75rem;
  margin: -0.75rem -0.75rem 0 -0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.cronograma-header.clickable:hover {
  background-color: #f9fafb;
}

.cronograma-header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.btn-collapse {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
  color: var(--text-color, #6b7280);
  transition: transform 0.2s, color 0.2s;
}

.btn-collapse:hover {
  color: var(--primary-color, #3b82f6);
}

.icon-collapse {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s;
}

.cronograma-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge-concluido {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 9999px;
}

.cronograma-cliente {
  color: var(--text-light);
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.cronograma-data {
  font-size: 0.875rem;
  color: var(--text-color);
  margin: 0;
}

.cronograma-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-scheduled {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-in-progress {
  background-color: #fef3c7;
  color: #92400e;
}

.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.cronograma-info {
  padding-top: 1rem;
  margin-top: 0;
}

/* Transições para collapse */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 3000px;
  opacity: 1;
}

.cronograma-section {
  margin-top: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--bg-color);
  border-radius: 9999px;
  font-size: 0.875rem;
}

.materiais-checklist {
  margin-top: 0.5rem;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.cronograma-observacoes {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--text-light);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row-small {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.equipamentos-select {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.equipamento-select-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  gap: 0.5rem;
}

.materiais-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.material-card {
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background-color: var(--card-bg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.material-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.material-card.material-selected {
  border-color: var(--primary-color);
  background-color: #f0f4ff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
}

.material-card-label {
  display: block;
  cursor: pointer;
  margin: 0;
}

.material-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.material-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.material-image-container {
  width: 100%;
  height: 150px;
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-image-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: var(--bg-color);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-image-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  background-color: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  flex-shrink: 0;
}

.material-image-placeholder svg {
  width: 24px;
  height: 24px;
}

.material-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.material-nome {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-color);
}

.material-descricao {
  font-size: 0.8125rem;
  color: var(--text-light);
  line-height: 1.4;
}

.material-quantidade-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.qtd-label {
  font-size: 0.8125rem;
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
}

.qtd-input {
  flex: 1;
  max-width: 100px;
}

.equipamento-tipo {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-left: 0.25rem;
}

.tag-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
}

.empty-message {
  font-size: 0.875rem;
  color: var(--text-light);
  margin-top: 0.5rem;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
}

.mapa-section {
  margin-bottom: 2rem;
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: var(--shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
}

.mapa-header {
  margin-bottom: 1rem;
}

.mapa-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.mapa-aviso {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  padding: 0.75rem;
  background-color: #fef3c7;
  border-radius: 0.375rem;
  border-left: 3px solid #f59e0b;
}

.mapa-aviso span {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #92400e;
}

@media (max-width: 768px) {
  .cronograma-header {
    flex-direction: column;
  }

  .form-row,
  .form-row-small {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}
</style>

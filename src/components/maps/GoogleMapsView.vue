<template>
  <div class="google-maps-view">
    <div v-if="!apiKeyConfigured" class="map-error">
      <p>⚠️ Google Maps API Key não configurada.</p>
      <p>Configure a variável <code>VITE_GOOGLE_MAPS_API_KEY</code> no arquivo .env</p>
    </div>
    <div v-else ref="mapContainer" class="map-container"></div>
    <Offcanvas
      v-model:show="showDetails"
      :title="selectedCronograma ? (selectedCronograma.os_manual ? `OS ${selectedCronograma.os_manual}` : `Cronograma #${selectedCronograma.id}`) : 'Detalhes'"
      position="right"
      @close="closeDetails"
      class="offcanvas-detailed"
    >
      <div v-if="selectedCronograma" class="cronograma-details">
        <div v-if="selectedCronograma.os_manual" class="detail-item">
          <strong>OS:</strong> {{ selectedCronograma.os_manual }}
        </div>
        <div class="detail-item">
          <strong>Data:</strong> {{ formatDate(selectedCronograma.data_instalacao) }}
          <span v-if="selectedCronograma.data_termino">
            - {{ formatDate(selectedCronograma.data_termino) }}
          </span>
          <span v-if="selectedCronograma.hora_inicio">
            às {{ selectedCronograma.hora_inicio }}
          </span>
          <span v-if="selectedCronograma.hora_fim">
            - {{ selectedCronograma.hora_fim }}
          </span>
        </div>
        <div class="detail-item">
          <strong>Endereço:</strong> {{ selectedCronograma.endereco }}
        </div>
        <div v-if="selectedCronograma.cep" class="detail-item">
          <strong>CEP:</strong> {{ formatCEP(selectedCronograma.cep) }}
        </div>
        <div class="detail-item">
          <strong>Status:</strong>
          <span :class="['status-badge', getStatusClass(selectedCronograma.status)]">
            {{ getStatusLabel(selectedCronograma.status) }}
          </span>
        </div>
        <div v-if="selectedCronograma.equipes && selectedCronograma.equipes.length > 0" class="detail-item">
          <strong>Equipes Escaladas:</strong>
          <div class="equipes-list">
            <div v-for="equipe in selectedCronograma.equipes" :key="equipe.id" class="equipe-item">
              <div class="equipe-header-item">
                <strong class="equipe-nome">{{ equipe.nome }}</strong>
              </div>
              <div v-if="equipe.funcionarios && equipe.funcionarios.length > 0" class="membros-list">
                <div class="membros-label">Membros:</div>
                <div class="membros-grid">
                  <div v-for="funcionario in equipe.funcionarios" :key="funcionario.id" class="membro-item">
                    <span class="membro-nome">{{ funcionario.nome }}</span>
                    <span v-if="funcionario.cargo" class="membro-cargo">{{ funcionario.cargo }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="sem-membros">Nenhum membro na equipe</p>
            </div>
          </div>
        </div>
        <div v-if="selectedCronograma.materiais && selectedCronograma.materiais.length > 0" class="detail-item">
          <strong>Materiais:</strong>
          <ul class="materiais-list">
            <li v-for="material in selectedCronograma.materiais" :key="material.id">
              {{ material.nome }}
              <span class="material-quantity">
                ({{ material.quantidade_necessaria }}
                <span v-if="material.quantidade_confirmada !== undefined && material.quantidade_confirmada > 0">
                  / {{ material.quantidade_confirmada }} confirmado{{ material.quantidade_confirmada > 1 ? 's' : '' }}
                </span>)
              </span>
            </li>
          </ul>
        </div>
        <div v-if="selectedCronograma.carros && selectedCronograma.carros.length > 0" class="detail-item">
          <strong>Veículos:</strong>
          <div class="carros-list">
            <div v-for="carro in selectedCronograma.carros" :key="carro.id" class="carro-item">
              <div v-if="carro.imagem_url" class="carro-image-small">
                <img :src="carro.imagem_url" :alt="carro.modelo || carro.placa" />
              </div>
              <div class="carro-info">
                <div class="carro-placa">{{ carro.placa }}</div>
                <div class="carro-modelo">
                  <span v-if="carro.modelo">{{ carro.modelo }}</span>
                  <span v-if="carro.marca"> - {{ carro.marca }}</span>
                  <span v-if="carro.ano"> ({{ carro.ano }})</span>
                </div>
                <div v-if="getRodizioInfo(carro.placa)" class="rodizio-info-map">
                  <span class="rodizio-label-map">Rodízio:</span>
                  <span :class="['rodizio-dia-map', { 'rodizio-hoje-map': getRodizioInfo(carro.placa).aviso }]">
                    {{ getRodizioInfo(carro.placa).diaNome }}
                  </span>
                  <span v-if="getRodizioInfo(carro.placa).aviso" class="rodizio-aviso-map">
                    ⚠️ Hoje é dia de rodízio!
                  </span>
                </div>
                <span :class="['carro-status', carro.disponivel ? 'status-available' : 'status-unavailable']">
                  {{ carro.disponivel ? 'Disponível' : 'Indisponível' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedCronograma.equipamentos && selectedCronograma.equipamentos.length > 0" class="detail-item">
          <strong>Equipamentos:</strong>
          <div class="tags-list">
            <span v-for="equipamento in selectedCronograma.equipamentos" :key="equipamento.id" class="tag">
              {{ equipamento.nome }}
              <span v-if="equipamento.tipo" class="tag-subtitle">
                ({{ equipamento.tipo === 'equipamento' ? 'Equipamento' : 'Ferramenta' }})
              </span>
            </span>
          </div>
        </div>
        <div v-if="selectedCronograma && selectedCronograma.id" class="detail-item todo-list-section">
          <CronogramaTodoList
            :key="`todo-list-${selectedCronograma.id}`"
            :cronograma-id="selectedCronograma.id"
          />
        </div>
        <div v-if="selectedCronograma.observacoes" class="detail-item">
          <strong>Observações:</strong>
          <p class="observacoes-text">{{ selectedCronograma.observacoes }}</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeDetails">Fechar</button>
        <button type="button" class="btn btn-secondary" @click="printPDF" :disabled="generatingPDF">
          <svg v-if="!generatingPDF" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span v-if="generatingPDF">Gerando...</span>
          <span v-else>Imprimir PDF</span>
        </button>
        <button type="button" class="btn btn-primary" @click="editCronograma">Editar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { initGoogleMaps } from '../../services/googleMapsService.js';
import { cronogramaService } from '../../services/cronogramaService.js';
import { generateCronogramaPDF } from '../../services/pdfService.js';
import { calcularDiaRodizio } from '../../utils/rodizioUtils.js';
import Offcanvas from '../common/Offcanvas.vue';
import CronogramaTodoList from '../cronograma/CronogramaTodoList.vue';

const props = defineProps({
  cronogramas: {
    type: Array,
    default: () => []
  },
  selectedCronogramaId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['cronograma-selected', 'edit-cronograma']);

const toast = useToast();
const mapContainer = ref(null);
const showDetails = ref(false);
const selectedCronograma = ref(null);
const apiKeyConfigured = ref(true);
const generatingPDF = ref(false);
let map = null;
let markers = [];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const formatCEP = (cep) => {
  if (!cep) return '';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return clean;
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

// Criar ícone personalizado usando o SVG do arquivo map.svg
const createCustomIcon = async () => {
  try {
    // Carregar o SVG do arquivo
    const response = await fetch('/images/map.svg');
    if (!response.ok) {
      throw new Error('Erro ao carregar SVG');
    }
    const svgText = await response.text();
    
    // Converter SVG para data URL (Google Maps aceita SVG como data URL)
    const encodedSvg = encodeURIComponent(svgText);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
    
    return {
      url: dataUrl,
      scaledSize: new window.google.maps.Size(40, 55),
      anchor: new window.google.maps.Point(20, 55),
      origin: new window.google.maps.Point(0, 0)
    };
  } catch (error) {
    console.error('Erro ao carregar ícone do mapa:', error);
    // Fallback para um ícone padrão
    return {
      url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 40)
    };
  }
};

const initMap = async () => {
  if (!mapContainer.value) return;

  try {
    const initialized = await initGoogleMaps();
    if (!initialized || !window.google || !window.google.maps) {
      console.error('Google Maps API não disponível');
      apiKeyConfigured.value = false;
      return;
    }
    apiKeyConfigured.value = true;

    // Calcular centro do mapa baseado nos cronogramas
    const validCronogramas = props.cronogramas.filter(
      c => c.latitude && c.longitude
    );

    let center = { lat: -23.5505, lng: -46.6333 }; // São Paulo como padrão

    if (validCronogramas.length > 0) {
      const avgLat = validCronogramas.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / validCronogramas.length;
      const avgLng = validCronogramas.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / validCronogramas.length;
      center = { lat: avgLat, lng: avgLng };
    }

    map = new window.google.maps.Map(mapContainer.value, {
      center: center,
      zoom: validCronogramas.length > 1 ? 10 : 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });

    // Criar ícone personalizado
    const customIcon = await createCustomIcon();

    // Adicionar markers
    clearMarkers();
    validCronogramas.forEach(cronograma => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(cronograma.latitude),
          lng: parseFloat(cronograma.longitude)
        },
        map: map,
        icon: customIcon,
        title: cronograma.endereco || `Cronograma #${cronograma.id}`
      });

      marker.addListener('click', () => {
        // Criar nova referência para garantir reatividade do componente
        selectedCronograma.value = JSON.parse(JSON.stringify(cronograma));
        showDetails.value = true;
        emit('cronograma-selected', cronograma);
      });

      markers.push(marker);
    });

    // Se houver um cronograma selecionado, centralizar nele
    if (props.selectedCronogramaId) {
      const selected = validCronogramas.find(c => c.id === props.selectedCronogramaId);
      if (selected) {
        map.setCenter({
          lat: parseFloat(selected.latitude),
          lng: parseFloat(selected.longitude)
        });
        map.setZoom(16);
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar mapa:', error);
  }
};

const clearMarkers = () => {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
};

const closeDetails = () => {
  showDetails.value = false;
  // Aguardar um pouco antes de limpar para permitir transição
  setTimeout(() => {
    selectedCronograma.value = null;
  }, 300);
};

const editCronograma = () => {
  if (selectedCronograma.value) {
    emit('edit-cronograma', selectedCronograma.value);
    closeDetails();
  }
};

const getRodizioInfo = (placa) => {
  return calcularDiaRodizio(placa);
};

const printPDF = async () => {
  if (!selectedCronograma.value) return;

  try {
    generatingPDF.value = true;
    
    // Buscar dados completos do cronograma diretamente da API
    // Isso garante que temos todos os dados atualizados, incluindo funcionários
    let cronogramaCompleto;
    try {
      const todosCronogramas = await cronogramaService.getAll();
      const cronogramaEncontrado = todosCronogramas.find(c => c.id === selectedCronograma.value.id);
      cronogramaCompleto = cronogramaEncontrado || { ...selectedCronograma.value };
    } catch (error) {
      console.warn('Erro ao buscar cronograma completo, usando dados locais:', error);
      cronogramaCompleto = { ...selectedCronograma.value };
    }
    
    // Buscar todos do cronograma se não estiverem carregados
    if (!cronogramaCompleto.todos && cronogramaCompleto.id) {
      try {
        const todos = await cronogramaService.getTodos(cronogramaCompleto.id);
        cronogramaCompleto.todos = todos;
      } catch (error) {
        console.warn('Erro ao buscar todos do cronograma:', error);
        cronogramaCompleto.todos = [];
      }
    }

    // Carregar logo do public
    const logoUrl = '/images/logo_afirma.svg';
    await generateCronogramaPDF(cronogramaCompleto, logoUrl);
    toast.success('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF. Tente novamente.');
  } finally {
    generatingPDF.value = false;
  }
};

watch(() => props.cronogramas, () => {
  if (map) {
    initMap();
  }
}, { deep: true });

watch(() => props.selectedCronogramaId, () => {
  if (map && props.selectedCronogramaId) {
    const selected = props.cronogramas.find(c => c.id === props.selectedCronogramaId);
    if (selected && selected.latitude && selected.longitude) {
      map.setCenter({
        lat: parseFloat(selected.latitude),
        lng: parseFloat(selected.longitude)
      });
      map.setZoom(16);
    }
  }
});

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  clearMarkers();
  map = null;
});
</script>

<style scoped>
.google-maps-view {
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 500px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--border-color, #e5e7eb);
}

.cronograma-details {
  padding: 0.5rem 0;
}

.detail-item {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.detail-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-color, #111827);
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
  background-color: var(--bg-color, #f3f4f6);
  border-radius: 9999px;
  font-size: 0.875rem;
}

.tag-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
}

.equipes-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.equipe-item {
  padding: 0.75rem;
  background-color: var(--bg-color, #f9fafb);
  border-radius: 0.375rem;
  border: 1px solid var(--border-color, #e5e7eb);
}

.equipe-header-item {
  margin-bottom: 0.5rem;
}

.equipe-nome {
  font-size: 0.9375rem;
  color: var(--text-color);
}

.membros-list {
  margin-top: 0.5rem;
}

.membros-label {
  font-size: 0.8125rem;
  color: var(--text-light, #6b7280);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.membros-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.membro-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 0.25rem;
  border: 1px solid var(--border-color, #e5e7eb);
}

.membro-nome {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.membro-cargo {
  font-size: 0.75rem;
  color: var(--text-light, #6b7280);
}

.sem-membros {
  font-size: 0.8125rem;
  color: var(--text-light, #6b7280);
  font-style: italic;
  margin: 0.5rem 0 0 0;
}

.rodizio-info-map {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rodizio-label-map {
  font-size: 0.75rem;
  color: var(--text-light, #6b7280);
  font-weight: 500;
}

.rodizio-dia-map {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-color);
}

.rodizio-dia-map.rodizio-hoje-map {
  color: #dc2626;
  font-weight: 700;
}

.rodizio-aviso-map {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  background-color: #fee2e2;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
  margin-top: 0.25rem;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.materiais-list {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  list-style: disc;
}

.materiais-list li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.material-quantity {
  color: var(--text-light, #6b7280);
  font-size: 0.875rem;
}

.carros-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.carro-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--bg-color, #f9fafb);
  border-radius: 0.375rem;
  border: 1px solid var(--border-color, #e5e7eb);
}

.carro-image-small {
  width: 150px;
  height: 150px;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carro-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.carro-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.carro-placa {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.9375rem;
}

.carro-modelo {
  font-size: 0.875rem;
  color: var(--text-color);
}

.carro-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  display: inline-block;
  width: fit-content;
}

.carro-status.status-available {
  background-color: #d1fae5;
  color: #065f46;
}

.carro-status.status-unavailable {
  background-color: #fee2e2;
  color: #991b1b;
}

.todo-list-section {
  padding-top: 1rem;
}

.observacoes-text {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--text-color);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
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

.map-error {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  color: #991b1b;
}

.map-error p {
  margin: 0.5rem 0;
}

.map-error code {
  background-color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

/* Estilos para offcanvas customizado */
:deep(.offcanvas-detailed .offcanvas-container) {
  max-width: 500px;
  width: 90vw;
}

:deep(.offcanvas-detailed .offcanvas-body) {
  overflow-y: auto;
}

:deep(.offcanvas-detailed .offcanvas-footer) {
  border-top: 1px solid var(--border-color, #e5e7eb);
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .map-container,
  .map-error {
    height: 300px;
  }

  :deep(.offcanvas-detailed .offcanvas-container) {
    width: 100vw;
    max-width: 100vw;
  }

}
</style>

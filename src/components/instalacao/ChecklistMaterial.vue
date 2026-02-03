<template>
  <div class="checklist-material">
    <div class="checklist-header">
      <h4>Checklist de Materiais</h4>
      <span class="checklist-progress">
        {{ materiaisConfirmados }}/{{ materiais.length }} confirmados
      </span>
    </div>
    <div v-if="materiais.length === 0" class="empty-state">
      <p>Nenhum material adicionado ao cronograma</p>
    </div>
    <div v-else class="checklist-items">
      <div
        v-for="material in materiais"
        :key="material.id"
        class="checklist-item"
        :class="{ 'item-confirmado': material.quantidade_confirmada >= material.quantidade_necessaria }"
      >
        <label class="checklist-checkbox">
          <input
            type="checkbox"
            :checked="material.quantidade_confirmada >= material.quantidade_necessaria"
            @change="toggleMaterial(material)"
          />
          <span class="material-nome">{{ material.nome }}</span>
        </label>
        <div class="material-quantidade">
          <span class="quantidade-info">
            Confirmado: 
            <input
              type="number"
              :value="material.quantidade_confirmada"
              @input="updateQuantidade(material, $event.target.value)"
              min="0"
              :max="material.quantidade_necessaria"
              class="quantidade-input"
            />
            / {{ material.quantidade_necessaria }} {{ material.unidade || 'un' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { cronogramaService } from '../../services/cronogramaService.js';

const props = defineProps({
  cronogramaId: {
    type: Number,
    required: true
  },
  materiais: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update']);

const toast = useToast();
const materiaisLocal = ref([...props.materiais]);

watch(() => props.materiais, (newMateriais) => {
  materiaisLocal.value = [...newMateriais];
}, { deep: true });

const materiaisConfirmados = computed(() => {
  return materiaisLocal.value.filter(m => 
    m.quantidade_confirmada >= m.quantidade_necessaria
  ).length;
});

const toggleMaterial = async (material) => {
  const novaQuantidade = material.quantidade_confirmada >= material.quantidade_necessaria
    ? 0
    : material.quantidade_necessaria;

  await updateQuantidade(material, novaQuantidade);
};

const updateQuantidade = async (material, quantidade) => {
  const quantidadeNum = parseInt(quantidade) || 0;
  
  if (quantidadeNum < 0) {
    return;
  }

  try {
    // Atualizar localmente primeiro
    const materialIndex = materiaisLocal.value.findIndex(m => m.id === material.id);
    if (materialIndex !== -1) {
      materiaisLocal.value[materialIndex].quantidade_confirmada = quantidadeNum;
    }

    // Atualizar no backend usando o novo endpoint
    await cronogramaService.updateMaterialQuantidade(
      props.cronogramaId,
      material.id,
      quantidadeNum
    );

    emit('update');
    toast.success('Quantidade atualizada!');
  } catch (error) {
    toast.error('Erro ao atualizar quantidade');
    console.error(error);
    // Reverter mudança local em caso de erro
    const materialIndex = materiaisLocal.value.findIndex(m => m.id === material.id);
    if (materialIndex !== -1) {
      materiaisLocal.value[materialIndex].quantidade_confirmada = material.quantidade_confirmada;
    }
  }
};
</script>

<style scoped>
.checklist-material {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-color);
}

.checklist-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.checklist-progress {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-color);
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--card-bg);
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.checklist-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow);
}

.item-confirmado {
  background-color: #d1fae5;
  border-color: var(--secondary-color);
}

.checklist-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
}

.checklist-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.material-nome {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.item-confirmado .material-nome {
  color: #065f46;
  text-decoration: line-through;
}

.material-quantidade {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantidade-info {
  font-size: 0.875rem;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantidade-input {
  width: 60px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  text-align: center;
}

.quantidade-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .checklist-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .material-quantidade {
    width: 100%;
  }
}
</style>

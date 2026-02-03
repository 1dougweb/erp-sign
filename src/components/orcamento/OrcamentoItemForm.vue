<template>
  <div class="orcamento-item-form">
    <div class="item-header">
      <h4>Item {{ index + 1 }}</h4>
      <button
        v-if="showRemove"
        type="button"
        class="btn-remove"
        @click="$emit('remove')"
        title="Remover item"
      >
        <TrashIcon class="icon" />
      </button>
    </div>
    
    <div class="form-row">
      <div class="input-group">
        <label for="material_id" class="input-label">Material *</label>
        <select
          id="material_id"
          v-model="localItem.material_id"
          class="input"
          @change="onMaterialChange"
          :error="errors.material_id"
        >
          <option :value="null">Selecione um material...</option>
          <option
            v-for="material in materiais"
            :key="material.id"
            :value="material.id"
          >
            {{ material.nome }}
          </option>
        </select>
        <span v-if="errors.material_id" class="error-message">{{ errors.material_id }}</span>
      </div>
      
      <div class="input-group">
        <label for="metragem_cm2" class="input-label">Metragem (cm²) *</label>
        <input
          id="metragem_cm2"
          v-model.number="localItem.metragem_cm2"
          type="number"
          step="0.01"
          min="0"
          class="input"
          placeholder="0.00"
          @input="calculateTotal"
          :error="errors.metragem_cm2"
        />
        <span v-if="errors.metragem_cm2" class="error-message">{{ errors.metragem_cm2 }}</span>
      </div>
    </div>
    
    <div class="input-group">
      <label for="descricao_trabalho" class="input-label">Descrição do Trabalho</label>
      <textarea
        id="descricao_trabalho"
        v-model="localItem.descricao_trabalho"
        class="textarea"
        rows="2"
        placeholder="Descreva o trabalho a ser realizado..."
      ></textarea>
    </div>
    
    <div class="item-calculations">
      <div class="calc-row">
        <span class="calc-label">Valor unitário (cm²):</span>
        <span class="calc-value">R$ {{ formatCurrency(valorUnitario) }}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">Total do item:</span>
        <span class="calc-value calc-total">R$ {{ formatCurrency(valorTotal) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { TrashIcon } from '@heroicons/vue/24/outline';
import { materialPrecoService } from '../../services/materialPrecoService.js';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  materiais: {
    type: Array,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  showRemove: {
    type: Boolean,
    default: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:item', 'remove']);

const localItem = ref({ ...props.item });
const valorUnitario = ref(0);

// Buscar valor unitário quando material mudar
const onMaterialChange = async () => {
  if (localItem.value.material_id) {
    try {
      const precos = await materialPrecoService.getByMaterial(localItem.value.material_id);
      const precoImpressao = precos.find(p => p.tipo_calculo === 'impressao_cm2' && p.ativo);
      
      if (precoImpressao) {
        valorUnitario.value = parseFloat(precoImpressao.valor_por_cm2);
        localItem.value.valor_unitario = valorUnitario.value;
      } else {
        valorUnitario.value = 0;
        localItem.value.valor_unitario = 0;
      }
      
      calculateTotal();
    } catch (error) {
      console.error('Erro ao buscar preço do material:', error);
      valorUnitario.value = 0;
      localItem.value.valor_unitario = 0;
    }
  } else {
    valorUnitario.value = 0;
    localItem.value.valor_unitario = 0;
  }
  
  emit('update:item', localItem.value);
};

const calculateTotal = () => {
  const metragem = parseFloat(localItem.value.metragem_cm2 || 0);
  const unitario = parseFloat(localItem.value.valor_unitario || valorUnitario.value || 0);
  const total = metragem * unitario;
  
  localItem.value.valor_total = total;
  emit('update:item', localItem.value);
};

const formatCurrency = (value) => {
  return parseFloat(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const valorTotal = computed(() => {
  return parseFloat(localItem.value.valor_total || 0);
});

// Watch para atualizar quando item prop mudar
watch(() => props.item, (newItem) => {
  localItem.value = { ...newItem };
  if (newItem.material_id && !valorUnitario.value) {
    onMaterialChange();
  }
}, { deep: true });

// Inicializar valor unitário se já tiver material
if (localItem.value.material_id) {
  onMaterialChange();
}
</script>

<style scoped>
.orcamento-item-form {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.item-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--danger-color);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.btn-remove:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.btn-remove .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.item-calculations {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.calc-label {
  font-size: 0.875rem;
  color: var(--text-light);
}

.calc-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.calc-total {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

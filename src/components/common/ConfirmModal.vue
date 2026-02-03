<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="confirm-modal-overlay" @click.self="handleCancel">
        <div class="confirm-modal-content">
          <div class="confirm-modal-header">
            <div class="confirm-modal-icon" :class="iconClass">
              <component :is="iconComponent" class="icon" />
            </div>
            <h3 class="confirm-modal-title">{{ title }}</h3>
          </div>
          <div class="confirm-modal-body">
            <p>{{ message }}</p>
            <p v-if="details" class="confirm-modal-details">{{ details }}</p>
          </div>
          <div class="confirm-modal-footer">
            <button 
              type="button" 
              class="btn btn-outline" 
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="confirmButtonClass"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { ExclamationTriangleIcon, InformationCircleIcon, TrashIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmar ação'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'info'
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  }
});

const emit = defineEmits(['update:show', 'confirm', 'cancel']);

const iconComponent = computed(() => {
  if (props.type === 'danger') return TrashIcon;
  if (props.type === 'info') return InformationCircleIcon;
  return ExclamationTriangleIcon;
});

const iconClass = computed(() => {
  return `icon-${props.type}`;
});

const confirmButtonClass = computed(() => {
  if (props.type === 'danger') return 'btn-danger';
  if (props.type === 'info') return 'btn-primary';
  return 'btn-warning';
});

const handleConfirm = () => {
  emit('confirm');
  emit('update:show', false);
};

const handleCancel = () => {
  emit('cancel');
  emit('update:show', false);
};
</script>

<style scoped>
.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.confirm-modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.confirm-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-warning {
  background: #fef3c7;
  color: #d97706;
}

.icon-danger {
  background: #fee2e2;
  color: #dc2626;
}

.icon-info {
  background: #dbeafe;
  color: #2563eb;
}

.confirm-modal-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.confirm-modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.confirm-modal-body {
  padding: 1.5rem;
}

.confirm-modal-body p {
  margin: 0;
  color: #374151;
  line-height: 1.6;
}

.confirm-modal-details {
  margin-top: 0.75rem !important;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.confirm-modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  justify-content: flex-end;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

/* Transições Vue */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-modal-content,
.modal-leave-active .confirm-modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-modal-content,
.modal-leave-to .confirm-modal-content {
  transform: translateY(-10px);
}
</style>

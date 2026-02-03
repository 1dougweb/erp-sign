<template>
  <Teleport to="body">
    <Transition name="offcanvas">
      <div v-if="show" class="offcanvas-overlay" @click.self="handleClose">
        <div class="offcanvas-backdrop" :class="{ 'backdrop-active': show }"></div>
        <div class="offcanvas-container" :class="[`offcanvas-${position}`, attrs.class || '']">
          <div class="offcanvas-header">
            <h2 class="offcanvas-title">{{ title }}</h2>
            <button class="offcanvas-close" @click="handleClose" aria-label="Fechar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="offcanvas-body">
            <slot></slot>
          </div>
          <div class="offcanvas-footer" v-if="showFooter">
            <slot name="footer">
              <button class="btn btn-outline" @click="handleClose">Cancelar</button>
              <button class="btn btn-primary" @click="handleConfirm">{{ confirmText }}</button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Formulário'
  },
  position: {
    type: String,
    default: 'right',
    validator: (value) => ['left', 'right', 'top', 'bottom'].includes(value)
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: 'Salvar'
  }
});

const attrs = useAttrs();

const emit = defineEmits(['update:show', 'close', 'confirm']);

const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

const handleConfirm = () => {
  emit('confirm');
};

watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.offcanvas-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.offcanvas-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}

.backdrop-active {
  opacity: 1;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.offcanvas-container {
  position: relative;
  z-index: 1001;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  width: 100%;
  max-width: 500px;
  height: 100vh;
  overflow: hidden;
}

.offcanvas-right {
  animation: slideInRight 0.3s ease-out;
}

.offcanvas-left {
  animation: slideInLeft 0.3s ease-out;
}

.offcanvas-top {
  animation: slideInTop 0.3s ease-out;
}

.offcanvas-bottom {
  animation: slideInBottom 0.3s ease-out;
}

.offcanvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.offcanvas-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.offcanvas-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.offcanvas-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.offcanvas-close svg {
  width: 1.5rem;
  height: 1.5rem;
}

.offcanvas-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.offcanvas-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  justify-content: flex-end;
}

/* Animações */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInTop {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideInBottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Transições Vue */
.offcanvas-enter-active,
.offcanvas-leave-active {
  transition: opacity 0.3s ease;
}

.offcanvas-enter-active .offcanvas-container,
.offcanvas-leave-active .offcanvas-container {
  transition: transform 0.3s ease;
}

.offcanvas-enter-from {
  opacity: 0;
}

.offcanvas-enter-from .offcanvas-container.offcanvas-right {
  transform: translateX(100%);
}

.offcanvas-enter-from .offcanvas-container.offcanvas-left {
  transform: translateX(-100%);
}

.offcanvas-enter-from .offcanvas-container.offcanvas-top {
  transform: translateY(-100%);
}

.offcanvas-enter-from .offcanvas-container.offcanvas-bottom {
  transform: translateY(100%);
}

.offcanvas-leave-to {
  opacity: 0;
}

.offcanvas-leave-to .offcanvas-container.offcanvas-right {
  transform: translateX(100%);
}

.offcanvas-leave-to .offcanvas-container.offcanvas-left {
  transform: translateX(-100%);
}

.offcanvas-leave-to .offcanvas-container.offcanvas-top {
  transform: translateY(-100%);
}

.offcanvas-leave-to .offcanvas-container.offcanvas-bottom {
  transform: translateY(100%);
}

/* Scrollbar personalizada */
.offcanvas-body::-webkit-scrollbar {
  width: 8px;
}

.offcanvas-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.offcanvas-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.offcanvas-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 640px) {
  .offcanvas-container {
    max-width: 100vw;
    width: 100%;
  }
}
</style>

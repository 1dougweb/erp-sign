import { createApp, h } from 'vue';
import ConfirmModal from '../components/common/ConfirmModal.vue';

// Estado global
let confirmApp = null;
let container = null;

function createConfirmModal() {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
  }

  if (!confirmApp) {
    confirmApp = createApp({
      data() {
        return {
          show: false,
          config: {
            title: 'Confirmar ação',
            message: '',
            details: '',
            type: 'warning',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
          },
          resolve: null,
          reject: null
        };
      },
      methods: {
        showModal(config) {
          return new Promise((resolve, reject) => {
            this.config = {
              title: config.title || 'Confirmar ação',
              message: config.message || 'Tem certeza que deseja realizar esta ação?',
              details: config.details || '',
              type: config.type || 'warning',
              confirmText: config.confirmText || 'Confirmar',
              cancelText: config.cancelText || 'Cancelar'
            };
            this.resolve = resolve;
            this.reject = reject;
            this.show = true;
          });
        },
        handleConfirm() {
          if (this.resolve) {
            this.resolve(true);
          }
          this.show = false;
          this.resolve = null;
          this.reject = null;
        },
        handleCancel() {
          if (this.reject) {
            this.reject(false);
          }
          this.show = false;
          this.resolve = null;
          this.reject = null;
        }
      },
      render() {
        return h(ConfirmModal, {
          show: this.show,
          title: this.config.title,
          message: this.config.message,
          details: this.config.details,
          type: this.config.type,
          confirmText: this.config.confirmText,
          cancelText: this.config.cancelText,
          'onUpdate:show': (value) => {
            this.show = value;
            if (!value && this.reject) {
              this.reject(false);
              this.resolve = null;
              this.reject = null;
            }
          },
          onConfirm: this.handleConfirm,
          onCancel: this.handleCancel
        });
      }
    });

    confirmApp.mount(container);
  }

  return confirmApp._instance.exposed || confirmApp._instance.setupState;
}

// Instância global
let confirmInstance = null;

export default {
  install(app) {
    confirmInstance = createConfirmModal();
    
    // Adicionar método global $confirm
    app.config.globalProperties.$confirm = (config) => {
      return confirmInstance.showModal(config);
    };

    // Adicionar método global $confirmDelete
    app.config.globalProperties.$confirmDelete = (itemName, itemType = 'item') => {
      return confirmInstance.showModal({
        title: 'Confirmar exclusão',
        message: `Tem certeza que deseja excluir ${itemType === 'item' ? 'este item' : `o ${itemType}`}?`,
        details: itemName ? `${itemType === 'item' ? 'Item' : itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemName}` : 'Esta ação não pode ser desfeita.',
        type: 'danger',
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      });
    };
  }
};

// Exportar função para uso em composables
export function useGlobalConfirm() {
  if (!confirmInstance) {
    confirmInstance = createConfirmModal();
  }
  
  return {
    confirm: (config) => confirmInstance.showModal(config),
    confirmDelete: (itemName, itemType = 'item') => {
      return confirmInstance.showModal({
        title: 'Confirmar exclusão',
        message: `Tem certeza que deseja excluir ${itemType === 'item' ? 'este item' : `o ${itemType}`}?`,
        details: itemName ? `${itemType === 'item' ? 'Item' : itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemName}` : 'Esta ação não pode ser desfeita.',
        type: 'danger',
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      });
    }
  };
}

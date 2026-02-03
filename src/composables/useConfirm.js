import { ref, h, render } from 'vue';
import ConfirmModal from '../components/common/ConfirmModal.vue';

// Estado global do modal
const showModal = ref(false);
const modalConfig = ref({
  title: 'Confirmar ação',
  message: '',
  details: '',
  type: 'warning',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar'
});

let currentResolve = null;
let currentReject = null;

// Container para o modal
let modalContainer = null;
let modalComponent = null;

function createModalContainer() {
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'confirm-modal-container';
    document.body.appendChild(modalContainer);
  }
  return modalContainer;
}

function showConfirmModal(config) {
  return new Promise((resolve, reject) => {
    modalConfig.value = {
      title: config.title || 'Confirmar ação',
      message: config.message || 'Tem certeza que deseja realizar esta ação?',
      details: config.details || '',
      type: config.type || 'warning',
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar'
    };

    currentResolve = resolve;
    currentReject = reject;
    showModal.value = true;
  });
}

function handleConfirm() {
  if (currentResolve) {
    currentResolve(true);
  }
  showModal.value = false;
  currentResolve = null;
  currentReject = null;
}

function handleCancel() {
  if (currentReject) {
    currentReject(false);
  }
  showModal.value = false;
  currentResolve = null;
  currentReject = null;
}

/**
 * Composable para usar o modal de confirmação
 */
export function useConfirm() {
  const confirm = (config) => {
    return showConfirmModal(config);
  };

  const confirmDelete = (itemName, itemType = 'item') => {
    return showConfirmModal({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir ${itemType === 'item' ? 'este item' : `o ${itemType}`}?`,
      details: itemName ? `${itemType === 'item' ? 'Item' : itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemName}` : 'Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
  };

  const confirmAction = (message, title = 'Confirmar ação', type = 'warning') => {
    return showConfirmModal({
      title,
      message,
      type,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  };

  return {
    confirm,
    confirmDelete,
    confirmAction
  };
}

// Exportar para uso no componente global
export { showModal, modalConfig, handleConfirm, handleCancel };

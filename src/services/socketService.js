// WebSocket removido - não é mais usado
// Mantido apenas para compatibilidade com imports existentes

export const connectSocket = () => {
  // WebSocket desabilitado
  return null;
};

export const disconnectSocket = () => {
  // WebSocket desabilitado
};

export const joinTarefaRoom = (tarefaId) => {
  // WebSocket desabilitado
};

export const leaveTarefaRoom = (tarefaId) => {
  // WebSocket desabilitado
};

export const joinCronogramaRoom = (cronogramaId) => {
  // WebSocket desabilitado
};

export const leaveCronogramaRoom = (cronogramaId) => {
  // WebSocket desabilitado
};

export const getSocket = () => {
  // Retorna um objeto mock que não faz nada
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    connected: false
  };
};

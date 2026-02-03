import { Server } from 'socket.io';

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Entrar em uma sala específica para tarefa
    socket.on('join-tarefa', (tarefaId) => {
      socket.join(`tarefa-${tarefaId}`);
      console.log(`Cliente ${socket.id} entrou na sala tarefa-${tarefaId}`);
    });

    // Sair de uma sala de tarefa
    socket.on('leave-tarefa', (tarefaId) => {
      socket.leave(`tarefa-${tarefaId}`);
      console.log(`Cliente ${socket.id} saiu da sala tarefa-${tarefaId}`);
    });

    // Entrar em uma sala específica para cronograma
    socket.on('join-cronograma', (cronogramaId) => {
      socket.join(`cronograma-${cronogramaId}`);
      console.log(`Cliente ${socket.id} entrou na sala cronograma-${cronogramaId}`);
    });

    // Sair de uma sala de cronograma
    socket.on('leave-cronograma', (cronogramaId) => {
      socket.leave(`cronograma-${cronogramaId}`);
      console.log(`Cliente ${socket.id} saiu da sala cronograma-${cronogramaId}`);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado. Chame initializeSocket primeiro.');
  }
  return io;
};

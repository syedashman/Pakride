import { io } from 'socket.io-client';
import { BASE_URL } from './api';

let socket = null;

export function connectSocket(userId) {
  if (socket && socket.connected) {
    socket.emit('register_user', userId);
    return socket;
  }
  if (socket) socket.disconnect();
  
  socket = io(BASE_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected!', socket.id);
    socket.emit('register_user', userId);
  });

  socket.on('connect_error', (err) => {
    console.log('Socket error:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
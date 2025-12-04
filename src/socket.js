import { io } from 'socket.io-client';

const BACKEND_BASE = 'https://robo-1-qqhu.onrender.com';
const SOCKET_PATH = '/socket.io';

let socket = null;
let joinedRooms = new Set();

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket && socket.connected) return socket;

  const opts = {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    auth: {},
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  };

  if (token) opts.auth = { token };

  socket = io(BACKEND_BASE, opts);

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
    // join user's room if token identifies them on server-side
  });

  // Rejoin tracked rooms after reconnect
  socket.on('reconnect', (attempt) => {
    console.log('[socket] reconnected after', attempt);
    try {
      for (const room of joinedRooms) {
        socket.emit('join', { room });
      }
    } catch (e) {
      console.warn('[socket] failed to rejoin rooms', e);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err?.message || err);
  });

  return socket;
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (e) {
    console.warn('[socket] disconnect failed', e);
  }
}

// Emit an event with acknowledgement and timeout. Returns a Promise that resolves with ack data or rejects with error.
export function emitWithAck(event, payload = {}, timeout = 10000) {
  return new Promise((resolve, reject) => {
    try {
      if (!socket) {
        // Try to auto-connect with token from localStorage
        const token = localStorage.getItem('authToken');
        connectSocket(token);
      }

      if (!socket) return reject(new Error('Socket not available'));

      // Use socket.timeout to set ack timeout
      socket.timeout(timeout).emit(event, payload, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

export function on(event, cb) {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

export function off(event, cb) {
  if (!socket) return;
  socket.off(event, cb);
}

export function joinRoom(room) {
  if (!socket) return Promise.reject(new Error('Socket not connected'));
  try {
    // track the room so we rejoin on reconnect
    joinedRooms.add(room);
    socket.emit('join', { room });
    return Promise.resolve(true);
  } catch (e) {
    return Promise.reject(e);
  }
}

export function leaveRoom(room) {
  if (!socket) return Promise.reject(new Error('Socket not connected'));
  try {
    joinedRooms.delete(room);
    socket.emit('leave', { room });
    return Promise.resolve(true);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default {
  connectSocket,
  disconnectSocket,
  emitWithAck,
  on,
  off,
  getSocket,
};

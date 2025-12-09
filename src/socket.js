import { io } from 'socket.io-client';

// Configure your backend base (can also come from env)
const BACKEND_BASE =  'https://robo-zv8u.onrender.com ';
const SOCKET_PATH = '/socket.io';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  try {
    if (socket && socket.connected) return socket;

    const opts = {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      auth: {},
      reconnection: true,
    };

    if (token) opts.auth = { token };

    socket = io(BACKEND_BASE, opts);

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message || err);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', reason);
    });

    return socket;
  } catch (e) {
    console.warn('[socket] connect failed', e);
    return null;
  }
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (e) {
    console.warn('[socket] disconnect error', e);
  }
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

export function emit(event, payload) {
  if (!socket) return false;
  socket.emit(event, payload);
  return true;
}

// Emit with acknowledgement and timeout. Returns a Promise that resolves with the ack payload.
export function emitWithAck(event, payload, timeout = 10000) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // Ensure socket exists; try to auto-connect using stored token if available
        if (!socket) {
          try {
            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
            connectSocket(token);
          } catch (e) {}
        }

        // Wait briefly for the socket to become connected (up to 2000ms)
        const waitForConnected = (ms = 2000) => new Promise((res) => {
          const start = Date.now();
          if (socket && socket.connected) return res(true);
          const iv = setInterval(() => {
            if (socket && socket.connected) {
              clearInterval(iv);
              return res(true);
            }
            if (Date.now() - start >= ms) {
              clearInterval(iv);
              return res(false);
            }
          }, 100);
        });

        const connected = await waitForConnected(2000);
        if (!connected) {
          // If not connected, still attempt emit but return a clearer error
          return reject(new Error('Socket not connected (emitWithAck)'));
        }

        const timed = socket.timeout(Number(timeout) || 10000);
        console.log('[socket] emitWithAck emitting', { event, payload, timeout });

        // safety fallback: ensure promise settles even if socket ack callback never fires
        let settled = false;
        const fallbackTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          console.warn('[socket] emitWithAck fallback timer fired for', event);
          return reject(new Error('emitWithAck: fallback timeout'));
        }, (Number(timeout) || 10000) + 1000);

        timed.emit(event, payload, (err, response) => {
          if (settled) return; // already timed out
          settled = true;
          clearTimeout(fallbackTimer);
          if (err) {
            // socket.io timeout error has `message` like 'operation has timed out'
            return reject(new Error(err && err.message ? err.message : 'Socket ack error'));
          }
          return resolve(response);
        });
      } catch (e) {
        return reject(e instanceof Error ? e : new Error(String(e)));
      }
    })();
  });
}

// Join a room (convenience helper). Returns a promise that resolves when server acks.
export function joinRoom(room, timeout = 5000) {
  if (!room) return Promise.reject(new Error('room required'));
  return emitWithAck('join', { room }, timeout).catch((err) => {
    // fallback: try emit without ack
    try {
      emit('join', { room });
      return Promise.resolve(true);
    } catch (e) {
      return Promise.reject(err || e);
    }
  });
}

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  on,
  off,
  emit,
};

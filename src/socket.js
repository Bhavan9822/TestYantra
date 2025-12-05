// import { io } from 'socket.io-client';

// const BACKEND_BASE = 'https://robo-1-qqhu.onrender.com';
// const SOCKET_PATH = '/socket.io';

// let socket = null;
// let joinedRooms = new Set();

// export function getSocket() {
//   return socket;
// }

// export function connectSocket(token) {
//   if (socket && socket.connected) return socket;

//   const opts = {
//     path: SOCKET_PATH,
//     transports: ['websocket', 'polling'],
//     auth: {},
//     reconnection: true,
//     reconnectionAttempts: Infinity,
//     timeout: 20000,
//   };

//   if (token) opts.auth = { token };

//   socket = io(BACKEND_BASE, opts);

//   socket.on('connect', () => {
//     console.log('[socket] connected', socket.id);
//     // join user's room if token identifies them on server-side
//   });

//   // Rejoin tracked rooms after reconnect
//   socket.on('reconnect', (attempt) => {
//     console.log('[socket] reconnected after', attempt);
//     try {
//       for (const room of joinedRooms) {
//         socket.emit('join', { room });
//       }
//     } catch (e) {
//       console.warn('[socket] failed to rejoin rooms', e);
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log('[socket] disconnected', reason);
//   });

//   socket.on('connect_error', (err) => {
//     console.warn('[socket] connect_error', err?.message || err);
//   });

//   return socket;
// }

// export function disconnectSocket() {
//   try {
//     if (socket) {
//       socket.disconnect();
//       socket = null;
//     }
//   } catch (e) {
//     console.warn('[socket] disconnect failed', e);
//   }
// }

// // Emit an event with acknowledgement and timeout. Returns a Promise that resolves with ack data or rejects with error.
// export function emitWithAck(event, payload = {}, timeout = 10000) {
//   return new Promise((resolve, reject) => {
//     try {
//       if (!socket) {
//         // Try to auto-connect with token from localStorage
//         const token = localStorage.getItem('authToken');
//         connectSocket(token);
//       }

//       if (!socket) return reject(new Error('Socket not available'));

//       // Use socket.timeout to set ack timeout
//       socket.timeout(timeout).emit(event, payload, (err, res) => {
//         if (err) return reject(err);
//         return resolve(res);
//       });
//     } catch (e) {
//       return reject(e);
//     }
//   });
// }

// export function on(event, cb) {
//   if (!socket) return () => {};
//   socket.on(event, cb);
//   return () => socket.off(event, cb);
// }

// export function off(event, cb) {
//   if (!socket) return;
//   socket.off(event, cb);
// }

// export function joinRoom(room) {
//   if (!socket) return Promise.reject(new Error('Socket not connected'));
//   try {
//     // track the room so we rejoin on reconnect
//     joinedRooms.add(room);
//     socket.emit('join', { room });
//     return Promise.resolve(true);
//   } catch (e) {
//     return Promise.reject(e);
//   }
// }

// export function leaveRoom(room) {
//   if (!socket) return Promise.reject(new Error('Socket not connected'));
//   try {
//     joinedRooms.delete(room);
//     socket.emit('leave', { room });
//     return Promise.resolve(true);
//   } catch (e) {
//     return Promise.reject(e);
//   }
// }

// export default {
//   connectSocket,
//   disconnectSocket,
//   emitWithAck,
//   on,
//   off,
//   getSocket,
// };


// !!!!!!!!!

// socket.js
import { io } from 'socket.io-client';

const BACKEND_BASE = 'https://robo-1-qqhu.onrender.com';
const SOCKET_PATH = '/socket.io';

let socket = null;
let joinedRooms = new Set();
let eventListeners = new Map(); // Track all event listeners for cleanup

// Global socket event handlers that need to be reattached on reconnect
const globalHandlers = {
  'followRequestReceived': null,
  'followRequestAccepted': null,
  'followRequestRejected': null,
  'newFollower': null,
  'notification': null
};

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket && socket.connected) {
    console.log('[socket] Already connected');
    return socket;
  }

  // Clean up old socket if exists
  if (socket) {
    try {
      socket.disconnect();
    } catch (e) {
      console.warn('[socket] Error disconnecting old socket', e);
    }
    socket = null;
  }

  const opts = {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    auth: {},
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  };

  if (token) {
    opts.auth = { token };
  }

  console.log('[socket] Connecting to', BACKEND_BASE, 'with options:', { ...opts, auth: { token: token ? 'present' : 'missing' } });
  
  socket = io(BACKEND_BASE, opts);

  // Connection events
  socket.on('connect', () => {
    console.log('[socket] Connected with ID:', socket.id);
    
    // Join user's personal room after connection
    const userId = getUserIdFromToken(token);
    if (userId) {
      const userRoom = `user:${userId}`;
      joinRoom(userRoom).catch(err => 
        console.warn('[socket] Failed to join user room:', err)
      );
    }
    
    // Reattach global event handlers
    reattachGlobalHandlers();
    
    // Emit connection event to notify server
    socket.emit('user:connected', { userId: getUserIdFromToken(token) });
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] Disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      console.log('[socket] Server disconnected, attempting to reconnect...');
      socket.connect();
    }
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] Connection error:', err.message);
    // Try to reconnect with fresh token
    setTimeout(() => {
      const freshToken = localStorage.getItem('authToken');
      if (freshToken && (!socket || !socket.connected)) {
        console.log('[socket] Attempting reconnection with fresh token');
        connectSocket(freshToken);
      }
    }, 2000);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`[socket] Reconnected after ${attemptNumber} attempts`);
    
    // Rejoin all rooms
    try {
      for (const room of joinedRooms) {
        socket.emit('join', { room });
      }
    } catch (e) {
      console.warn('[socket] Failed to rejoin rooms:', e);
    }
    
    // Reattach global handlers
    reattachGlobalHandlers();
    
    // Notify server of reconnection
    socket.emit('user:reconnected', { 
      userId: getUserIdFromToken(token),
      socketId: socket.id 
    });
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`[socket] Reconnection attempt ${attemptNumber}`);
  });

  socket.on('reconnect_error', (err) => {
    console.warn('[socket] Reconnection error:', err.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('[socket] Reconnection failed');
  });

  // Error handler
  socket.on('error', (err) => {
    console.error('[socket] Error:', err);
  });

  return socket;
}

// Helper to extract user ID from JWT token
function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || payload._id || payload.sub;
  } catch (e) {
    console.warn('[socket] Failed to parse token:', e);
    return null;
  }
}

// Reattach global event handlers after reconnection
function reattachGlobalHandlers() {
  Object.entries(globalHandlers).forEach(([event, handler]) => {
    if (handler && socket) {
      socket.on(event, handler);
    }
  });
}

export function disconnectSocket() {
  try {
    if (socket) {
      console.log('[socket] Disconnecting...');
      socket.disconnect();
      socket = null;
      joinedRooms.clear();
      eventListeners.clear();
    }
  } catch (e) {
    console.warn('[socket] Disconnect failed:', e);
  }
}

// Enhanced emit with acknowledgement and better error handling
export function emitWithAck(event, payload = {}, timeout = 10000) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure socket is connected
      if (!socket || !socket.connected) {
        const token = localStorage.getItem('authToken');
        if (token) {
          console.log(`[socket] Auto-connecting for event: ${event}`);
          connectSocket(token);
        }
        // Wait for socket to connect (with timeout)
        const waitTimeout = 5000; // ms
        let settled = false;

        const onConnect = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          socket.off('connect', onConnect);
          performEmit();
        };

        const onTimeout = () => {
          if (settled) return;
          settled = true;
          socket?.off('connect', onConnect);
          return reject(new Error('Socket not connected (timed out)'));
        };

        socket?.once('connect', onConnect);
        const timer = setTimeout(onTimeout, waitTimeout);
      } else {
        performEmit();
      }

      function performEmit() {
        try {
          console.log(`[socket] Emitting "${event}":`, payload);
          
          socket.timeout(timeout).emit(event, payload, (err, response) => {
            if (err) {
              console.error(`[socket] Error in "${event}" ack:`, err);
              return reject(err);
            }
            console.log(`[socket] "${event}" response:`, response);
            resolve(response);
          });
        } catch (emitErr) {
          console.error(`[socket] Exception emitting "${event}":`, emitErr);
          reject(emitErr);
        }
      }
    } catch (err) {
      console.error(`[socket] Error in emitWithAck for "${event}":`, err);
      reject(err);
    }
  });
}

// Simple emit without waiting for acknowledgement
export function emit(event, payload = {}) {
  if (!socket || !socket.connected) {
    console.warn(`[socket] Cannot emit "${event}" - socket not connected`);
    return false;
  }
  
  try {
    console.log(`[socket] Emitting "${event}":`, payload);
    socket.emit(event, payload);
    return true;
  } catch (err) {
    console.error(`[socket] Error emitting "${event}":`, err);
    return false;
  }
}

// Register an event listener with automatic cleanup tracking
export function on(event, callback) {
  if (!socket) {
    console.warn(`[socket] Cannot listen to "${event}" - socket not connected`);
    return () => {};
  }

  try {
    console.log(`[socket] Adding listener for "${event}"`);
    socket.on(event, callback);
    
    // Store for cleanup
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event).add(callback);
    
    // Store global handlers
    if (globalHandlers.hasOwnProperty(event)) {
      globalHandlers[event] = callback;
    }
    
    return () => {
      off(event, callback);
    };
  } catch (err) {
    console.error(`[socket] Error adding listener for "${event}":`, err);
    return () => {};
  }
}

// Remove specific event listener
export function off(event, callback) {
  if (!socket) return;
  
  try {
    socket.off(event, callback);
    
    // Remove from tracking
    if (eventListeners.has(event)) {
      eventListeners.get(event).delete(callback);
      if (eventListeners.get(event).size === 0) {
        eventListeners.delete(event);
      }
    }
    
    // Clear from global handlers if it matches
    if (globalHandlers[event] === callback) {
      globalHandlers[event] = null;
    }
  } catch (err) {
    console.warn(`[socket] Error removing listener for "${event}":`, err);
  }
}

// Remove all listeners for a specific event
export function offAll(event) {
  if (!socket) return;
  
  try {
    socket.removeAllListeners(event);
    
    // Clear tracking
    eventListeners.delete(event);
    
    // Clear global handler
    if (globalHandlers.hasOwnProperty(event)) {
      globalHandlers[event] = null;
    }
  } catch (err) {
    console.warn(`[socket] Error removing all listeners for "${event}":`, err);
  }
}

// Join a room with tracking
export function joinRoom(room) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    try {
      console.log(`[socket] Joining room: ${room}`);
      
      socket.emit('join', { room }, (response) => {
        if (response && response.error) {
          console.warn(`[socket] Failed to join room ${room}:`, response.error);
          reject(new Error(response.error));
        } else {
          joinedRooms.add(room);
          console.log(`[socket] Successfully joined room: ${room}`);
          resolve(true);
        }
      });
    } catch (err) {
      console.error(`[socket] Error joining room ${room}:`, err);
      reject(err);
    }
  });
}

// Leave a room
export function leaveRoom(room) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    try {
      console.log(`[socket] Leaving room: ${room}`);
      
      socket.emit('leave', { room }, (response) => {
        joinedRooms.delete(room);
        console.log(`[socket] Left room: ${room}`);
        resolve(true);
      });
    } catch (err) {
      console.error(`[socket] Error leaving room ${room}:`, err);
      reject(err);
    }
  });
}

// Send follow request via socket
export function sendFollowRequestViaSocket(targetUserId) {
  return emitWithAck('follow:request', { 
    targetUserId,
    timestamp: Date.now()
  }, 15000);
}

// Accept follow request via socket
export function acceptFollowRequestViaSocket(requestId) {
  return emitWithAck('follow:accept', { 
    requestId,
    timestamp: Date.now()
  }, 10000);
}

// Reject follow request via socket
export function rejectFollowRequestViaSocket(requestId) {
  return emitWithAck('follow:reject', { 
    requestId,
    timestamp: Date.now()
  }, 10000);
}

// Get current connection status
export function getConnectionStatus() {
  if (!socket) return 'disconnected';
  return socket.connected ? 'connected' : 'disconnected';
}

// Get socket ID
export function getSocketId() {
  return socket?.id || null;
}

// Cleanup all listeners and disconnect
export function cleanup() {
  try {
    // Remove all event listeners
    eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        try {
          socket?.off(event, callback);
        } catch (e) {
          console.warn(`[socket] Error removing listener during cleanup:`, e);
        }
      });
    });
    
    eventListeners.clear();
    
    // Clear global handlers
    Object.keys(globalHandlers).forEach(key => {
      globalHandlers[key] = null;
    });
    
    // Disconnect socket
    disconnectSocket();
  } catch (err) {
    console.error('[socket] Error during cleanup:', err);
  }
}

// Initialize socket with token from localStorage on module load
(function initializeSocket() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('[socket] Auto-initializing with stored token');
      connectSocket(token);
    }
  } catch (err) {
    console.warn('[socket] Auto-initialization failed:', err);
  }
})();

export default {
  connectSocket,
  disconnectSocket,
  emitWithAck,
  emit,
  on,
  off,
  offAll,
  getSocket,
  joinRoom,
  leaveRoom,
  sendFollowRequestViaSocket,
  acceptFollowRequestViaSocket,
  rejectFollowRequestViaSocket,
  getConnectionStatus,
  getSocketId,
  cleanup
};
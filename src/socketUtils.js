import socketService from './socket';

/**
 * Emit a socket event and wait for an acknowledgement response.
 * @param {string} event - The event name
 * @param {any} payload - The payload to send
 * @param {number} timeout - Timeout in milliseconds (default 5000)
 * @returns {Promise} - Resolves with the ack response or rejects on timeout
 */
export const emitWithAck = async (event, payload, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const socket = socketService.getSocket();
    
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Socket emit timeout for event: ${event}`));
    }, timeout);

    try {
      socket.emit(event, payload, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

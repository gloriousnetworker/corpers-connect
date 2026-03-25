/**
 * Socket.IO singleton — one connection per browser session.
 * Call getSocket(token) to get or create the socket.
 * Call disconnectSocket() on logout.
 */
import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let _socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (_socket) {
    // Reconnect with fresh token if needed
    if (!_socket.connected) {
      (_socket as Socket & { auth: { token: string } }).auth = { token };
      _socket.connect();
    }
    return _socket;
  }

  _socket = io(WS_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

export function getExistingSocket(): Socket | null {
  return _socket;
}

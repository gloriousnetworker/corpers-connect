/**
 * Socket.IO singletons — one connection per namespace per browser session.
 *
 * /messaging  — messaging events, typing indicators, presence, notifications
 * /calls      — call signalling events
 *
 * Call getMessagingSocket(token) / getCallsSocket(token) to get-or-create.
 * Call disconnectAllSockets() on logout.
 *
 * Backward-compat aliases (getSocket, getExistingSocket, disconnectSocket)
 * are exported so existing callers that deal with messaging don't need changes.
 */
import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let _messagingSocket: Socket | null = null;
let _callsSocket: Socket | null = null;

function createSocket(namespace: string, token: string): Socket {
  return io(`${WS_URL}${namespace}`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });
}

export function getMessagingSocket(token: string): Socket {
  if (_messagingSocket) {
    if (!_messagingSocket.connected) {
      (_messagingSocket as Socket & { auth: { token: string } }).auth = { token };
      _messagingSocket.connect();
    }
    return _messagingSocket;
  }
  _messagingSocket = createSocket('/messaging', token);
  return _messagingSocket;
}

export function getCallsSocket(token: string): Socket {
  if (_callsSocket) {
    if (!_callsSocket.connected) {
      (_callsSocket as Socket & { auth: { token: string } }).auth = { token };
      _callsSocket.connect();
    }
    return _callsSocket;
  }
  _callsSocket = createSocket('/calls', token);
  return _callsSocket;
}

export function disconnectAllSockets(): void {
  if (_messagingSocket) {
    _messagingSocket.disconnect();
    _messagingSocket = null;
  }
  if (_callsSocket) {
    _callsSocket.disconnect();
    _callsSocket = null;
  }
}

export function getExistingMessagingSocket(): Socket | null {
  return _messagingSocket;
}

export function getExistingCallsSocket(): Socket | null {
  return _callsSocket;
}

// ── Backward-compat aliases (messaging namespace) ─────────────────────────────
export const getSocket = getMessagingSocket;
export const disconnectSocket = disconnectAllSockets;
export const getExistingSocket = getExistingMessagingSocket;

'use client';

import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Mounts the Socket.IO connection and notification polling once inside the
 * authenticated shell. Render-less — only runs hooks.
 */
export default function SocketInitializer() {
  useSocket();
  useNotifications();
  return null;
}

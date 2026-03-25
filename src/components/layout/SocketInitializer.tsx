'use client';

import { useSocket } from '@/hooks/useSocket';

/**
 * Mounts the Socket.IO connection once inside the authenticated shell.
 * This is a render-less component — it only exists to run the useSocket hook.
 */
export default function SocketInitializer() {
  useSocket();
  return null;
}

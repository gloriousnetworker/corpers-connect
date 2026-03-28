'use client';

import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useFCM } from '@/hooks/useFCM';
import { useCallSocket } from '@/hooks/useCallSocket';

/**
 * Mounts the Socket.IO connection, notification polling, FCM push
 * registration, and call socket events once inside the authenticated shell.
 * Render-less — only runs hooks.
 */
export default function SocketInitializer() {
  useSocket();
  useNotifications();
  useFCM();
  useCallSocket();
  return null;
}

'use client';

import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useFCM } from '@/hooks/useFCM';

/**
 * Mounts the Socket.IO connection, notification polling, and FCM push
 * registration once inside the authenticated shell. Render-less — only runs hooks.
 */
export default function SocketInitializer() {
  useSocket();
  useNotifications();
  useFCM();
  return null;
}

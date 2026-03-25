import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Notification } from '@/types/models';

/** GET /notifications — cursor-paginated list */
export async function getNotifications(
  cursor?: string,
  limit = 20
): Promise<PaginatedData<Notification>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Notification>>>(
    '/notifications',
    { params: { cursor, limit } }
  );
  return data.data;
}

/** GET /notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count'
  );
  return data.data?.count ?? 0;
}

/** POST /notifications/read — mark specific IDs as read */
export async function markAsRead(notificationIds: string[]): Promise<void> {
  await api.post('/notifications/read', { notificationIds });
}

/** POST /notifications/read-all — mark all as read */
export async function markAllRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

/** DELETE /notifications/:id */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

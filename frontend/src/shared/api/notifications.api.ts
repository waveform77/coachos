import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Notification } from '../types'

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<{ data: Notification[]; unreadCount: number }>(API_ENDPOINTS.NOTIFICATIONS.BASE, { params }).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)).then((r) => r.data),

  markAllRead: () =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ).then((r) => r.data),
}

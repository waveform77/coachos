import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'

export type ParentChild = {
  id: string
  firstName: string
  lastName: string
  devIndex: number
  photoURL?: string
  position?: string
}

// ============== Вариант A: Приглашения по email ==============

export type Invitation = {
  id: string
  playerID: string
  email: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt: string
  acceptedAt?: string
}

export type CreateInvitationRequest = {
  playerID: string
  email: string
}

// ============== Вариант C: Коды доступа ==============

export type LinkCode = {
  id: string
  playerID: string
  code: string
  expiresAt: string
  createdAt: string
}

export type UseLinkCodeRequest = {
  code: string
}

export const parentsApi = {
  // Базовые операции
  listChildren: () => apiClient.get<ParentChild[]>(API_ENDPOINTS.PARENT.CHILDREN).then((r) => r.data),

  // ============== Вариант A: Приглашения по email ==============
  // Тренер создает приглашение
  createInvitation: (data: CreateInvitationRequest) =>
    apiClient.post<Invitation>(API_ENDPOINTS.COACH.PARENT_INVITATIONS, data).then((r) => r.data),

  // Тренер смотрит приглашения игрока
  listInvitations: (playerId: string) =>
    apiClient.get<{ invitations: Invitation[] }>(API_ENDPOINTS.COACH.PARENT_INVITATIONS, { params: { playerId } }).then((r) => r.data),

  // Родитель принимает приглашение по токену
  acceptInvitation: (token: string) =>
    apiClient.post<{ message: string }>(API_ENDPOINTS.PARENT.ACCEPT_INVITATION, { token }).then((r) => r.data),

  // ============== Вариант C: Коды доступа ==============
  // Тренер создает код
  generateLinkCode: (playerID: string) =>
    apiClient.post<LinkCode>(API_ENDPOINTS.COACH.LINK_CODES, { playerID }).then((r) => r.data),

  // Тренер смотрит активные коды игрока
  listLinkCodes: (playerId: string) =>
    apiClient.get<{ codes: LinkCode[] }>(API_ENDPOINTS.COACH.LINK_CODES, { params: { playerId } }).then((r) => r.data),

  // Родитель использует код
  useLinkCode: (code: string) =>
    apiClient.post<{ message: string; playerID: string; playerName: string }>(API_ENDPOINTS.PARENT.USE_LINK_CODE, { code }).then((r) => r.data),
}

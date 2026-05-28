import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'

export interface MedicalRecord {
  id: string
  playerId: string
  condition: 'injury' | 'illness' | 'recovery' | 'fit'
  description: string
  startDate?: string
  endDate?: string
  severity?: 'minor' | 'moderate' | 'severe'
  status: 'active' | 'recovered'
  createdAt: string
}

export interface CreateMedicalRecordRequest {
  playerId: string
  condition: MedicalRecord['condition']
  description: string
  startDate?: string
  endDate?: string
  severity?: MedicalRecord['severity']
  status: MedicalRecord['status']
}

export const medicalApi = {
  listByPlayer: (playerId: string) =>
    apiClient.get<{ data: MedicalRecord[]; meta: { total: number } }>(`${API_ENDPOINTS.PLAYERS.DETAIL(playerId)}/medical-records`).then((r) => r.data),

  create: (data: CreateMedicalRecordRequest) =>
    apiClient.post<MedicalRecord>(API_ENDPOINTS.MEDICAL.RECORDS ?? '/medical-records', data).then((r) => r.data),

  update: (id: string, data: CreateMedicalRecordRequest) =>
    apiClient.patch<MedicalRecord>(`${API_ENDPOINTS.MEDICAL.RECORDS ?? '/medical-records'}/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${API_ENDPOINTS.MEDICAL.RECORDS ?? '/medical-records'}/${id}`).then((r) => r.data),
}

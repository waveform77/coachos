import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Exercise, PaginatedResponse } from '../types'

export const exercisesApi = {
  listExercises: (params?: { category?: string; difficulty?: number; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Exercise>>(API_ENDPOINTS.EXERCISES.BASE, { params }).then((r) => r.data),

  getExercise: (id: string) =>
    apiClient.get<Exercise>(API_ENDPOINTS.EXERCISES.DETAIL(id)).then((r) => r.data),

  createExercise: (data: Partial<Exercise>) =>
    apiClient.post<Exercise>(API_ENDPOINTS.EXERCISES.BASE, data).then((r) => r.data),

  updateExercise: (id: string, data: Partial<Exercise>) =>
    apiClient.patch<Exercise>(API_ENDPOINTS.EXERCISES.DETAIL(id), data).then((r) => r.data),

  deleteExercise: (id: string) =>
    apiClient.delete(API_ENDPOINTS.EXERCISES.DETAIL(id)).then((r) => r.data),
}

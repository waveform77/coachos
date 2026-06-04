import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { TrainingSession, TrainingBlock, AttendanceRecord, PaginatedResponse } from '../types'

export const sessionsApi = {
  listSessions: (params?: { teamId?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<TrainingSession>>(API_ENDPOINTS.SESSIONS.BASE, { params }).then((r) => r.data),

  getSession: (id: string) =>
    apiClient.get<TrainingSession>(API_ENDPOINTS.SESSIONS.DETAIL(id)).then((r) => r.data),

  createSession: (data: Partial<TrainingSession>) =>
    apiClient.post<TrainingSession>(API_ENDPOINTS.SESSIONS.BASE, data).then((r) => r.data),

  updateSession: (id: string, data: Partial<TrainingSession>) =>
    apiClient.patch<TrainingSession>(API_ENDPOINTS.SESSIONS.DETAIL(id), data).then((r) => r.data),

  deleteSession: (id: string) =>
    apiClient.delete(API_ENDPOINTS.SESSIONS.DETAIL(id)).then((r) => r.data),

  addBlock: (sessionId: string, data: Partial<TrainingBlock>) =>
    apiClient.post<TrainingBlock>(API_ENDPOINTS.SESSIONS.BLOCKS(sessionId), data).then((r) => r.data),

  saveBlocks: (sessionId: string, data: { blocks: Array<{ kind: string; orderIndex: number; durationMin?: number; notes?: string; exercises: Array<{ exerciseID: string; orderIndex: number; durationMin?: number; sets?: number; reps?: number; intensityOverride?: string }> }> }) =>
    apiClient.put(API_ENDPOINTS.SESSIONS.BLOCKS(sessionId), data).then((r) => r.data),

  addExerciseToBlock: (sessionId: string, blockId: string, data: { exerciseID: string; durationMin?: number; sets?: number; reps?: number }) =>
    apiClient.post(API_ENDPOINTS.SESSIONS.BLOCK_EXERCISES(sessionId, blockId), data).then((r) => r.data),

  getAttendance: (sessionId: string) =>
    apiClient.get<AttendanceRecord[]>(API_ENDPOINTS.SESSIONS.ATTENDANCE(sessionId)).then((r) => r.data),

  markAttendance: (sessionId: string, records: Array<{ playerID: string; status: string; reason?: string }>) =>
    apiClient.post(API_ENDPOINTS.SESSIONS.ATTENDANCE(sessionId), { records }).then((r) => r.data),

  completeSession: (id: string) =>
    apiClient.post(API_ENDPOINTS.SESSIONS.COMPLETE(id)).then((r) => r.data),
}

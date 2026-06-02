import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'

export interface BlockSuggestion {
  kind: string
  durationMin: number
  exercises: string[]
  notes: string
}

export interface TrainingPlanSuggestion {
  title: string
  overview: string
  blocks: BlockSuggestion[]
  totalLoad: number
  tips: string[]
}

export interface AIRecommendationItem {
  id?: string
  name: string
  reason: string
  priority: number
}

export interface AIPlayerAnalysis {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  devIndex: number
  summary: string
}

export interface AIProgressSummary {
  summary: string
  trend: string
  highlights: string[]
  alerts: string[]
}

export interface AIResponse {
  recommendations?: AIRecommendationItem[]
  plan?: TrainingPlanSuggestion
  analysis?: AIPlayerAnalysis
  progress?: AIProgressSummary
}

export interface TrainingPlanRequest {
  teamId: string
  goal: string
  duration: number
  focusAreas?: string[]
}

export interface RecommendExercisesRequest {
  playerId: string
  weakSkill: string
}

export interface AnalyzePlayerRequest {
  playerId: string
}

export interface SummarizeProgressRequest {
  playerId: string
  periodDays: number
}

export const aiApi = {
  generateTrainingPlan: (data: TrainingPlanRequest) =>
    apiClient.post<AIResponse>(API_ENDPOINTS.AI.TRAINING_PLAN, data).then((r) => r.data),

  recommendExercises: (data: RecommendExercisesRequest) =>
    apiClient.post<AIResponse>(API_ENDPOINTS.AI.RECOMMEND_EXERCISES, data).then((r) => r.data),

  analyzePlayer: (data: AnalyzePlayerRequest) =>
    apiClient.post<AIResponse>(API_ENDPOINTS.AI.ANALYZE_PLAYER, data).then((r) => r.data),

  summarizeProgress: (data: SummarizeProgressRequest) =>
    apiClient.post<AIResponse>(API_ENDPOINTS.AI.SUMMARIZE_PROGRESS, data).then((r) => r.data),

  getMyInsights: () =>
    apiClient.get<AIResponse>(API_ENDPOINTS.ME.AI_INSIGHTS).then((r) => r.data),

  generateMyInsights: () =>
    apiClient.post<AIResponse>(API_ENDPOINTS.ME.AI_INSIGHTS).then((r) => r.data),
}

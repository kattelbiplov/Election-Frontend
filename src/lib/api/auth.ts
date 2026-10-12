import { apiClient, unwrap } from './client'
import type { LoginResponse, RefreshResponse, SuccessEnvelope, User } from '../types'

export function login(email: string, password: string) {
  return unwrap<LoginResponse>(apiClient.post('/auth/login', { email, password }))
}

export function refreshSession(refreshToken: string) {
  return unwrap<RefreshResponse>(apiClient.post('/auth/refresh', { refreshToken }))
}

export function logout(refreshToken: string) {
  return apiClient.post('/auth/logout', { refreshToken })
}

export function fetchMe() {
  return unwrap<User>(apiClient.get<SuccessEnvelope<User>>('/auth/me'))
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword })
}

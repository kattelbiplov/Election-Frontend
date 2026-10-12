import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../store/authStore'
import type { ApiErrorBody, PaginatedEnvelope, RefreshResponse, SuccessEnvelope } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1'

// The API also serves a separate, self-contained vanilla-JS map page directly at /map
// (docs/modules/08-household-map-ui.md) — no longer linked from this React app now that
// src/features/map/MapPage.tsx exists as a native equivalent (Module 09's family tree only lives
// in the native version), but kept here in case direct/no-React-app access to it is ever useful
// again (e.g. a bare link for a phone with no app installed).
export const HOUSEHOLD_MAP_URL = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/map`

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
})

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// Concurrent 401s during a refresh should share one in-flight refresh call, not fire one each.
let refreshPromise: Promise<string> | null = null

async function performRefresh(): Promise<string> {
  const { refreshToken, setSession, user } = useAuthStore.getState()
  if (!refreshToken || !user) throw new Error('No refresh token available')

  const res = await axios.post<SuccessEnvelope<RefreshResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
  )
  const { accessToken, refreshToken: nextRefreshToken } = res.data.data
  setSession({ user, accessToken, refreshToken: nextRefreshToken })
  return accessToken
}

function hardLogout() {
  useAuthStore.getState().clear()
  if (!window.location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/login?redirect=${redirect}`
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ''

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        refreshPromise ??= performRefresh().finally(() => {
          refreshPromise = null
        })
        const accessToken = await refreshPromise
        config.headers.set('Authorization', `Bearer ${accessToken}`)
        return apiClient(config)
      } catch {
        hardLogout()
        return Promise.reject(error)
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      hardLogout()
    }

    return Promise.reject(error)
  },
)

export function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
  return promise.then((res) => res.data.data)
}

export interface Page<T> {
  items: T[]
  pagination: PaginatedEnvelope<T>['pagination']
}

export function unwrapPaginated<T>(promise: Promise<{ data: PaginatedEnvelope<T> }>): Promise<Page<T>> {
  return promise.then((res) => ({ items: res.data.data, pagination: res.data.pagination }))
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.error?.message) return body.error.message
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    if (!error.response) return 'Network error — check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorBody | undefined)?.error?.code
  }
  return undefined
}

export type { AxiosRequestConfig }

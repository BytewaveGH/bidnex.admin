'use client'
import axios, { AxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Attach the current access token from the NextAuth session to every request.
// getSession() hits /api/auth/session server-side, which runs the JWT callback.
// The JWT callback proactively refreshes the token when it's within 5 min of expiry,
// so by the time this interceptor resolves, the token should always be fresh.
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.user?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.user.accessToken}`
    config.headers['X-Tenant-Domain'] = session.user.tenant || 'admin'
    config.headers['Cache-Control'] = 'no-cache'
  }
  return config
})

// On 401: call getSession() again to get a JWT-callback-refreshed token, then retry once.
// If the session error flag is set (refresh token expired), sign the user out.
// We never call the refresh endpoint directly here — the JWT callback in auth.config.ts
// owns all token refresh so the HttpOnly cookie stays in sync.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    // Queue concurrent 401s so they all retry with the same new token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) { reject(error); return }
          original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
          resolve(apiClient(original))
        })
      })
    }

    isRefreshing = true
    try {
      // This GET to /api/auth/session triggers the JWT callback server-side.
      // If the access token is expired, the JWT callback calls refreshAccessToken,
      // gets new tokens from the backend, writes a new JWT cookie, and returns
      // the fresh session — all transparently.
      const session = await getSession()

      if (!session?.user?.accessToken || session.user.error === 'RefreshAccessTokenError') {
        // Refresh token is expired or missing — force a clean re-login
        refreshQueue.forEach((cb) => cb(null))
        signOut({ callbackUrl: '/en' })
        return Promise.reject(error)
      }

      const newToken = session.user.accessToken

      refreshQueue.forEach((cb) => cb(newToken))
      refreshQueue = []

      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
      return apiClient(original)
    } catch {
      refreshQueue.forEach((cb) => cb(null))
      refreshQueue = []
      signOut({ callbackUrl: '/en' })
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

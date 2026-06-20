'use client'
import axios, { AxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'
import { getSessionSync, waitForSession } from '@/lib/session-store'

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

apiClient.interceptors.request.use(async (config) => {
  const session = getSessionSync() ?? (await waitForSession())
  if (session?.user?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.user.accessToken}`
    config.headers['X-Tenant-Domain'] = session.user.tenant || 'admin'
    config.headers['Cache-Control'] = 'no-cache'
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise<any>((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) {
            reject(error)
            return
          }
          original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
          resolve(apiClient(original))
        })
      })
    }

    isRefreshing = true
    try {
      // getSession() hits /api/auth/session which runs the JWT callback server-side.
      // The JWT callback detects the expired access token and calls refreshAccessToken.
      const session = await getSession()

      if (!session?.user?.accessToken) {
        refreshQueue.forEach((cb) => cb(null))
        refreshQueue = []
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
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

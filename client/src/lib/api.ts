import axios from 'axios'
import { signOut } from 'firebase/auth'
import { firebaseAuth } from './firebase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  timeout: 180_000,
})

api.interceptors.request.use(async (config) => {
  const currentUser = firebaseAuth?.currentUser
  if (currentUser) {
    const token = await currentUser.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && firebaseAuth?.currentUser) {
      await signOut(firebaseAuth)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: string } | undefined)?.error ??
      error.message
    )
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

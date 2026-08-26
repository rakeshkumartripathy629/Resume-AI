export interface UserProfile {
  id: string
  firebaseUid: string
  email: string
  displayName: string
  photoURL: string
  provider: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

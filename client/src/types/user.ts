export interface UserProfile {
  id: string
  firebaseUid: string
  email: string
  displayName: string
  photoURL: string
  provider: string
  createdAt: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

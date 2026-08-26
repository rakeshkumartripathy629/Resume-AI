import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getRedirectResult,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { api } from '../lib/api'
import { firebaseAuth, googleProvider } from '../lib/firebase'
import type { UserProfile } from '../types/user'

interface AuthContextValue {
  currentUser: FirebaseUser | null
  profile: UserProfile | null
  isAdmin: boolean
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

interface SessionResponse {
  success: boolean
  data: { user: UserProfile }
}

async function syncSession(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const idToken = await firebaseUser.getIdToken()
  const response = await api.post<SessionResponse>('/auth/session', { idToken })
  return response.data.data.user
}

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    // Handle redirect result (after Google sign-in redirect)
    getRedirectResult(firebaseAuth).then((result) => {
      if (result) {
        // Redirect completed — onAuthStateChanged will handle the rest
      }
    }).catch(() => {})

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setCurrentUser(firebaseUser)
      if (firebaseUser) {
        try {
          const user = await syncSession(firebaseUser)
          setProfile(user)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create session')
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signInWithGoogle(): Promise<void> {
    if (!firebaseAuth) throw new Error('Firebase is not configured')
    setError(null)
    await signInWithRedirect(firebaseAuth, googleProvider)
  }

  async function signInWithEmail(email: string, password: string): Promise<void> {
    if (!firebaseAuth) throw new Error('Firebase is not configured')
    setError(null)
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    setProfile(await syncSession(credential.user))
  }

  async function signUpWithEmail(email: string, password: string): Promise<void> {
    if (!firebaseAuth) throw new Error('Firebase is not configured')
    setError(null)
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    setProfile(await syncSession(credential.user))
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // Session may already be gone; still sign out locally.
    }
    if (firebaseAuth) {
      await signOut(firebaseAuth)
    }
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAdmin: profile?.role === 'admin',
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

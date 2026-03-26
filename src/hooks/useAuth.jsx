import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Demo credentials — easy to swap when Supabase is ready
const DEMO_EMAIL    = 'admin@edumap.mw'
const DEMO_PASSWORD = 'edumap2025'
const SESSION_KEY   = 'edumap_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession())

  function signIn(email, password) {
    if (
      email.trim().toLowerCase() === DEMO_EMAIL &&
      password === DEMO_PASSWORD
    ) {
      const user = { email, name: 'Admin User', role: 'admin' }
      saveSession(user)
      setSession(user)
      return { error: null }
    }
    return { error: { message: 'Invalid email or password. Use admin@edumap.mw / edumap2025' } }
  }

  function signOut() {
    clearSession()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

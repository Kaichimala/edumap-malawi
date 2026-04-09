import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })
    return { data, error }
  }

  async function signIn(email, password) {
    // Mock authentication for development
    if (email && password) {
      const mockUser = { id: '1', email, user_metadata: { full_name: 'Admin User' } };
      setUser(mockUser)
      setSession({ user: mockUser })
      return { data: { user: mockUser }, error: null }
    }
    return { data: null, error: { message: 'Invalid credentials' } }
  }

  async function signOut() {
    setUser(null)
    setSession(null)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isAuthenticated: !!user,
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

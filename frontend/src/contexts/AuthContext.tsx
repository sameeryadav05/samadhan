import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type User = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  level?: number // ✅ added to fix TS2339 in App.tsx
  xp?: number    // ✅ added to fix TS2339 in App.tsx
}

type AuthContextType = {
  token: string | null
  user: User | null
  isLoading: boolean
  login: (payload: { token: string; user: User }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('sb_token')
        const storedUser = localStorage.getItem('sb_user')
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser) as User) // ✅ cast to User
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
        localStorage.removeItem('sb_token')
        localStorage.removeItem('sb_user')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value: AuthContextType = useMemo(() => ({
    token,
    user,
    isLoading,
    login: ({ token, user }) => {
      setToken(token)
      setUser(user)
      localStorage.setItem('sb_token', token)
      localStorage.setItem('sb_user', JSON.stringify(user))
    },
    logout: () => {
      setToken(null)
      setUser(null)
      localStorage.removeItem('sb_token')
      localStorage.removeItem('sb_user')
    }
  }), [token, user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/api/client'
import type { User } from '@/api/types'

type AuthValue = {
  user: User | null
  fetching: boolean
  refetch: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refetch = useCallback(async () => {
    try {
      const next = await api<User | null>('/api/me')
      setUser(next)
      return next
    } catch {
      setUser(null)
      return null
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const logout = useCallback(async () => {
    await api('/api/session', { method: 'DELETE' })
    await refetch()
  }, [refetch])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      fetching: !ready,
      refetch,
      logout,
    }),
    [logout, ready, refetch, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // For now, we'll simulate an authenticated admin user
    // This should be replaced with actual authentication logic
    setUser({
      id: '1',
      email: 'admin@example.com',
      role: 'admin'
    })
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading
  }
}

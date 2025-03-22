"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { userApi } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  isVerified: boolean
  phone?: string
  bio?: string
  profilePicture?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    instagram?: string
  }
  preferences?: {
    emailNotifications: boolean
    reminderDays: number
    theme?: string
    notifications?: boolean
    language?: string
  }
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await userApi.getProfile()
      if (response.error) {
        setError(response.error)
        return
      }
      setUser(response.data)
    } catch (error) {
      console.error("Auth check failed:", error)
      setError("Authentication check failed")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.login({ email, password })
      if (response.error) {
        setError(response.error)
        return
      }
      setUser(response.data.user)
    } catch (error) {
      console.error("Login failed:", error)
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.logout()
      if (response.error) {
        setError(response.error)
        return
      }
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
      setError("Logout failed")
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.register({ email, password, name })
      if (response.error) {
        setError(response.error)
        return
      }
      setUser(response.data.user)
    } catch (error) {
      console.error("Registration failed:", error)
      setError("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.updateProfile(data)
      if (response.error) {
        setError(response.error)
        return
      }
      setUser(response.data)
    } catch (error) {
      console.error("Profile update failed:", error)
      setError("Profile update failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 
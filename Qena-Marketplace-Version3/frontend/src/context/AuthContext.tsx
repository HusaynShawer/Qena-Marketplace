import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../api/client'

interface User {
  id: number
  name: string
  email: string
  role: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendOTP: (email: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get('/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    setToken(access_token)
    const userRes = await api.get('/users/me')
    setUser(userRes.data)
    toast.success('Logged in successfully!')
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    await api.post('/auth/register', { name, email, password, role })
    toast.success('OTP sent! Check your email to verify.')
    // DON'T login here anymore
  }

  const verifyEmail = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-email', { email, otp })
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    setToken(access_token)
    const userRes = await api.get('/users/me')
    setUser(userRes.data)
    toast.success('Email verified! Welcome.')
  }

  const resendOTP = async (email: string) => {
    await api.post('/auth/resend-otp', { email })
    toast.success('New OTP sent!')
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, verifyEmail, resendOTP, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
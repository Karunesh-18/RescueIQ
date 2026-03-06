import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client, { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('riq_token'))
  const [restaurantId, setRestaurantId] = useState(null)
  const [ngoId, setNgoId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Attach / detach auth header when token changes
  useEffect(() => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('riq_token', token)
    } else {
      delete client.defaults.headers.common['Authorization']
      localStorage.removeItem('riq_token')
    }
  }, [token])

  // Rehydrate on mount
  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.getMe()
      .then(data => {
        setUser(data.user)
        setRestaurantId(data.restaurant_id)
        setNgoId(data.ngo_id)
      })
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password)
    setToken(data.access_token)
    setUser(data.user)
    // fetch profile ids
    const me = await api.getMe()
    setRestaurantId(me.restaurant_id)
    setNgoId(me.ngo_id)
    return data.user
  }, [])

  const register = useCallback(async (email, password, name, role, phone) => {
    const data = await api.register(email, password, name, role, phone)
    setToken(data.access_token)
    setUser(data.user)
    const me = await api.getMe()
    setRestaurantId(me.restaurant_id)
    setNgoId(me.ngo_id)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setRestaurantId(null)
    setNgoId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, restaurantId, ngoId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser)
        // Validate token expiration
        if (!isTokenExpired(token)) {
          setUser(userData)
        } else {
          // Token expired, clear storage
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const isTokenExpired = token => {
    if (!token) return true
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return decodedToken.exp < currentTime
    } catch (error) {
      return true
    }
  }

  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const updateUser = updatedUserData => {
    setUser(updatedUserData)
    localStorage.setItem('user', JSON.stringify(updatedUserData))
  }

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

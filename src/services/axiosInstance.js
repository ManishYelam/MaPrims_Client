import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL
const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(
  config => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        const token = parsedUser?.token
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
      } catch {
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
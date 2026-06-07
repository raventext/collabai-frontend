import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

// automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// if token expired, try refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post('http://localhost:8080/api/auth/refresh', {
            refreshToken,
          })
          localStorage.setItem('accessToken', res.data.accessToken)
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`
          return axios(error.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
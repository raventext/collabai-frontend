import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,

  login: (userData, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user: userData, accessToken })
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, accessToken: null })
  },
}))

export default useAuthStore
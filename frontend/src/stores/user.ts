import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: number
  username: string
  name: string
  role: 'volunteer' | 'college_admin' | 'platform_admin'
  collegeId?: number
  collegeName?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  function setUser(userData: User) {
    user.value = userData
    // 使用sessionStorage，每个标签页独立存储
    sessionStorage.setItem('user', JSON.stringify(userData))
    // 同时保存到localStorage作为备份
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function setToken(tokenValue: string) {
    token.value = tokenValue
    // 使用sessionStorage，每个标签页独立存储
    sessionStorage.setItem('token', tokenValue)
    // 同时保存到localStorage作为备份
    localStorage.setItem('token', tokenValue)
  }

  function logout() {
    user.value = null
    token.value = null
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  function initUser() {
    // 优先从sessionStorage读取（支持多标签页不同账号）
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    const savedToken = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      // 同步到sessionStorage
      sessionStorage.setItem('user', savedUser)
    }
    if (savedToken) {
      token.value = savedToken
      // 同步到sessionStorage
      sessionStorage.setItem('token', savedToken)
    }
  }

  return {
    user,
    token,
    setUser,
    setToken,
    logout,
    initUser
  }
})


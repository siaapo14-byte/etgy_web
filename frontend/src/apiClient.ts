import { Configuration } from '@/api-services/configuration'

/**
 * 统一的 swagger client 配置：
 * - basePath 走同源 /api...（配合 Vite proxy，避免浏览器直连后端导致 CORS）
 * - accessToken 从 localStorage/sessionStorage 读取
 */
export const apiConfig = new Configuration({
  basePath: '',
  accessToken: async () => localStorage.getItem('token') || sessionStorage.getItem('token') || ''
})


import { Configuration } from '@/api-services/configuration'

/**
 * 统一的 swagger client 配置：
 * - basePath 走同源 /api...（配合 Vite proxy，避免浏览器直连后端导致 CORS）
 * - accessToken 从 localStorage/sessionStorage 读取
 */
export const apiConfig = new Configuration({
  // 强制同源：浏览器请求 http://localhost:5173/api/...，再由 Vite proxy 转发到后端，避免 CORS
  // 如果你确实要浏览器直连后端（不走代理），才把这里改成 http://192.168.1.10:3000
  basePath: window.location.origin,
  accessToken: async () => localStorage.getItem('token') || sessionStorage.getItem('token') || ''
})

/**
 * 登录用的配置（不发送 token）
 * 因为登录接口虽然被标记为需要认证，但实际上不应该发送 token
 */
export const loginConfig = new Configuration({
  basePath: window.location.origin,
  accessToken: async () => ''
})


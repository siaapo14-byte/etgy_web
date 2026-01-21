/**
 * 冒烟测试：不依赖真实后端响应
 * - 目标：自动打印“各 TODO 接口”的请求字段模板（method/url/body）
 * - 做法：给 axios 增加 request interceptor，把 config 打出来
 *
 * 使用方式：在 frontend 目录运行：
 *   node --loader ts-node/esm scripts/smoke-templates.ts
 * 或者用 tsx（更推荐）：
 *   npx tsx scripts/smoke-templates.ts
 */

import axios, { type AxiosRequestConfig } from 'axios'
import { apiConfig } from '../src/apiClient'
import { VideosApiFp } from '../src/api-services/apis/videos-api'
import { LiveApiFp } from '../src/api-services/apis/live-api'
import { PlatformApiFp } from '../src/api-services/apis/platform-api'

// Node 环境下为 apiClient 提供最小 localStorage，避免因读取 token 直接报错
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).localStorage =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage ||
  (() => {
    const store = new Map<string, string>()
    return {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k)
    }
  })()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).sessionStorage =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).sessionStorage ||
  (() => {
    const store = new Map<string, string>()
    return {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k)
    }
  })()

const redact = (v: any) => {
  if (v == null) return v
  if (typeof v === 'string') return v
  if (typeof v !== 'object') return v
  const clone = Array.isArray(v) ? [...v] : { ...v }
  for (const k of Object.keys(clone)) {
    if (/password|token|authorization/i.test(k)) clone[k] = '***'
  }
  return clone
}

const printReq = (cfg: AxiosRequestConfig) => {
  const method = String(cfg.method || 'GET').toUpperCase()
  const url = [cfg.baseURL || '', cfg.url || ''].join('')
  const params = cfg.params
  const data = cfg.data

  const out = {
    method,
    url,
    params: redact(params),
    data: redact(data),
    headers: redact(cfg.headers)
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2))
}

async function main() {
  // 给全局 axios 加拦截器（openapi 分支走 axios）
  axios.interceptors.request.use((cfg) => {
    printReq(cfg)
    // 不真的发出去：直接抛错中断
    return Promise.reject(new Error('SMOKE_STOP'))
  })

  const samples = {
    videoPublish: async () => {
      const req = await VideosApiFp(apiConfig).apiVideosIdPublishPost('123')
      await req()
    },
    videoOffline: async () => {
      const req = await VideosApiFp(apiConfig).apiVideosIdOfflinePost('123')
      await req()
    },
    livePublish: async () => {
      const req = await LiveApiFp(apiConfig).apiLiveIdPublishPost('123')
      await req()
    },
    liveStart: async () => {
      const req = await LiveApiFp(apiConfig).apiLiveIdStartPost('123')
      await req()
    },
    liveOffline: async () => {
      const req = await LiveApiFp(apiConfig).apiLiveIdOfflinePost('123')
      await req()
    },
    // 平台端学院管理员状态修改（模板示例）
    collegeAdminStatus: async () => {
      const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdStatusPatch('1', { status: 'INACTIVE' } as any)
      await req()
    }
  }

  for (const [name, fn] of Object.entries(samples)) {
    try {
      // eslint-disable-next-line no-console
      console.log(`\n--- TEMPLATE: ${name} ---`)
      await fn()
    } catch (e: any) {
      if (String(e?.message) !== 'SMOKE_STOP') {
        // eslint-disable-next-line no-console
        console.log(`(ignored error) ${name}:`, e?.message || e)
      }
    }
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})

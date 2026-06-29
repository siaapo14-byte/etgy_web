/**
 * API工具类（兼容旧页面的调用方式）
 * - 不再使用 mockData
 * - 统一改为调用 swagger 生成的 api-services
 * - 并做字段适配，尽量不改动各页面 UI 逻辑
 */

import type { Video, Live, Volunteer, Child, College, AuditLog } from './mockData'
import { apiConfig } from '@/apiClient'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import { LiveApiFp } from '@/api-services/apis/live-api'
import { UsersApiFp } from '@/api-services/apis/users-api'
import { PlatformApiFp } from '@/api-services/apis/platform-api'
import { OSSApiFp } from '@/api-services/apis/ossapi'
import { ChildrenApiFp } from '@/api-services/apis/children-api'

import type {
  Video as ApiVideo,
  LiveRoom as ApiLiveRoom,
  VideoStatusEnum,
  LiveRoomStatusEnum
} from '@/api-services/models'

/** 从 axios / swagger 客户端错误中提取后端 message */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } }; body?: { message?: string }; message?: string }
  return e?.response?.data?.message || e?.body?.message || e?.message || fallback
}

const adaptVideo = (v: ApiVideo): Video => {
  // mockData 的字段命名与后端不同，这里尽量对齐旧 UI
  const gradeArr = v.gradeRange
    ? v.gradeRange
        .split(',')
        .map((i: string) => i.trim())
        .filter(Boolean)
    : []
  const createdAt = v.createdAt ? new Date(v.createdAt as any).toISOString() : new Date().toISOString()
  const reviewedAt = v.reviewedAt ? new Date(v.reviewedAt as any).toISOString() : undefined

  const statusMap: Record<VideoStatusEnum | string, any> = {
    DRAFT: 'draft',
    REVIEW: 'reviewing',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PUBLISHED: 'published',
    OFFLINE: 'offline'
  }

  return {
    id: v.id,
    title: v.title,
    description: v.intro || '',
    coverUrl: v.coverUrl || '',
    videoUrl: v.url,
    duration: v.duration || 0,
    grade: gradeArr,
    subject: v.subjectTag || '',
    tags: [],
    status: statusMap[v.status] || 'draft',
    volunteerId: v.uploaderId,
    volunteerName: (v.uploader as any)?.name || '',
    collegeId: v.collegeId,
    collegeName: (v.college as any)?.name || '',
    playCount: v.metrics?.playCount ?? 0,
    likeCount: v.metrics?.likeCount ?? 0,
    collectCount: v.metrics?.favCount ?? 0,
    createdAt,
    updatedAt: v.updatedAt ? new Date(v.updatedAt as any).toISOString() : createdAt,
    reviewReason: v.rejectReason || undefined,
    reviewTime: reviewedAt,
    reviewerName: ''
  }
}

const adaptLive = (l: ApiLiveRoom): Live => {
  const statusMap: Record<LiveRoomStatusEnum | string, any> = {
    DRAFT: 'draft',
    REVIEW: 'reviewing',
    PASSED: 'approved',
    REJECTED: 'rejected',
    LIVING: 'live',
    FINISHED: 'ended',
    OFFLINE: 'offline'
  }

  const start = l.planStartTime ? new Date(l.planStartTime as any).toISOString() : new Date().toISOString()
  const end = l.planEndTime ? new Date(l.planEndTime as any).toISOString() : start
  const duration = Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000))

  return {
    id: l.id,
    title: l.title,
    description: l.intro || '',
    startTime: start,
    duration,
    grade: [],
    subject: '',
    estimatedViewers: 0,
    status: statusMap[l.status] || 'draft',
    volunteerId: l.anchorId,
    volunteerName: (l.anchor as any)?.name || '',
    collegeId: l.collegeId,
    collegeName: (l.college as any)?.name || '',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: start,
    reviewReason: l.rejectReason || undefined,
    reviewTime: undefined,
    reviewerName: ''
  }
}

// TODO: 待后端接口完成后，配置baseURL
// const api = axios.create({
//   baseURL: 'http://localhost:3000/api',
//   timeout: 10000
// })

// 请求拦截器 - 添加token
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token')
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// 响应拦截器 - 处理错误
// api.interceptors.response.use(
//   response => response.data,
//   error => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token')
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )

// 视频相关API
export const videoApi = {
  // 获取视频列表
  getVideos: async (params?: any): Promise<Video[]> => {
    const req = await VideosApiFp(apiConfig).apiVideosGet(
      params?.status,
      params?.collegeId,
      params?.uploaderId,
      params?.search,
      params?.grade,
      params?.subject,
      params?.sort,
      params?.page,
      params?.pageSize
    )
    const res = await req()
    return (res.data.data || []).map(adaptVideo)
  },
  // 批量导入志愿者（接收解析后的数组）
  importVolunteers: async (rows: Array<any>): Promise<any> => {
    // rows: [{ studentId, name, gender, phone, email, collegeId? }]
    // 尝试一次性调用 accounts API（若支持），否则逐条创建
    try {
      // 有些后端可能不支持一次性批量创建账户，这里尝试按条创建以兼容更多后端
      const tasks = rows.map(async (item) => {
        const payload = {
          username: item.studentId || item.username || String(Date.now()),
          password: item.password || '123456',
          realName: item.name || '',
          studentId: item.studentId || '',
          collegeId: item.collegeId,
          phone: item.phone
        }
        const reqFn = await UsersApiFp(apiConfig).apiUsersVolunteersAccountsPost(payload as any)
        const r: any = await reqFn()
        return r.data
      })
      const results = await Promise.all(tasks)
      return results
    } catch (e) {
      console.warn('volunteerApi.importVolunteers: 批量创建失败', e)
      throw e
    }
  },
  
  // 获取视频详情
  getVideoById: async (id: number): Promise<Video> => {
    const req = await VideosApiFp(apiConfig).apiVideosIdGet(String(id))
    const res = await req()
    return adaptVideo(res.data.data as any)
  },
  
  // 上传视频
  uploadVideo: async (_formData: FormData): Promise<Video> => {
    // 旧页面走“上传视频”表单；后端现在是 OSS 直传/代传接口
    // 这里保留原有行为：页面应使用 videoApi.uploadToOss(file) 来上传并得到 objectUrl，再调用 apiVideosPost
    throw new Error('上传接口请改用 videoApi.uploadToOss(file) 获取上传结果，再调用 api-services 的 VideosApi')
  },

  // 统一的 OSS 上传封装：仅使用后端代传（按当前部署策略不再启用 presign 直传）
  uploadToOss: async (
    file: File,
    options?: { prefix?: string; useServer?: boolean; onProgress?: (percent: number) => void }
  ): Promise<{ objectUrl: string; key?: string }> => {
    const normalizeObjectUrl = (raw: any): string => {
      const s = String(raw || '').trim()
      if (!s) return ''
      // 关键：后端代传/OSS 返回的 url 可能是带签名参数的临时访问链接（非常长）
      // 业务入库只需要对象的稳定地址（不含 ? 后的 querystring），否则会触发数据库字段长度限制
      const idx = s.indexOf('?')
      return idx >= 0 ? s.slice(0, idx) : s
    }

    // 不论 options.useServer 传什么，都统一走后端代传，避免 /api/oss/upload-url 与第三方 OSS CORS 问题
    const data = await ossApiWrapper.uploadViaServer(file, options?.prefix || 'videos', options?.onProgress)
    const objectUrl = normalizeObjectUrl(
      data?.objectUrl ||
        data?.url ||
        data?.fileUrl ||
        data?.location ||
        data?.publicUrl ||
        ''
    )
    const key = data?.key || data?.filename || data?.name
    if (!objectUrl) {
      // 把后端返回带出来，方便定位 400/500 的真实原因
      throw new Error(`后端代传上传成功但未返回可用的 objectUrl/url（返回：${JSON.stringify(data)}）`)
    }
    return { objectUrl, key }
  },
  
  // 提交审核
  submitReview: async (id: number): Promise<void> => {
    const req = await VideosApiFp(apiConfig).apiVideosIdSubmitPost(String(id))
    await req()
  },
  
  // 上架/下架
  togglePublish: async (id: number, action: 'publish' | 'offline'): Promise<void> => {
    if (action === 'publish') {
      const req = await VideosApiFp(apiConfig).apiVideosIdPublishPost(String(id))
      await req()
      return
    }
    const req = await VideosApiFp(apiConfig).apiVideosIdOfflinePost(String(id))
    await req()
  }
}

// 直播相关API
export const liveApi = {
  // 获取直播列表
  getLives: async (params?: any): Promise<Live[]> => {
    // 使用 api-services 提供的 apiLiveGet 接口并做字段适配
    try {
      const req = await LiveApiFp(apiConfig).apiLiveGet(
        params?.tab,
        params?.collegeId,
        params?.search,
        params?.page,
        params?.pageSize
      )
      const res = await req()
      const payload: any = res?.data?.data ?? res?.data
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.list)
            ? payload.list
            : Array.isArray(payload?.records)
              ? payload.records
              : []
      return list.map((l: any) => adaptLive(l as ApiLiveRoom))
    } catch (e) {
      console.warn('liveApi.getLives: 获取直播列表失败，返回空数组', e)
      return []
    }
  },
  
  // 创建直播申请
  createLive: async (data: Partial<Live>): Promise<Live> => {
    const req = await LiveApiFp(apiConfig).apiLivePost({
      title: data.title || '',
      intro: data.description || '',
      planStartTime: data.startTime ? (new Date(data.startTime) as any) : (new Date() as any),
      planEndTime: data.startTime
        ? (new Date(new Date(data.startTime).getTime() + (data.duration || 0) * 1000) as any)
        : (new Date() as any),
      collegeId: data.collegeId || 0
    } as any)
    const res = await req()
    return adaptLive(res.data.data as any)
  },
  
  // 提交审核
  submitReview: async (id: number): Promise<void> => {
    const req = await LiveApiFp(apiConfig).apiLiveIdSubmitPost(String(id))
    await req()
  }
}

// OSS 统一上传工具（封装 presign / 后端代传 两种方案）
export const ossApiWrapper = {
  // 使用后端返回的 uploadUrl（预签名）直传，并返回 objectUrl/key
  uploadViaPresign: async (
    file: File,
    prefix = '',
    onProgress?: (percent: number) => void
  ): Promise<{ objectUrl: string; key?: string }> => {
    const req = await OSSApiFp(apiConfig).apiOssUploadUrlPost({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      prefix
    } as any)
    const res = await req()
    const data: any = res.data.data || {}
    const uploadUrl = data.uploadUrl || data.url
    if (!uploadUrl) throw new Error('获取上传 URL 失败')

    // 预签名 PUT 对请求头非常敏感：如果后端签名时没有把 Content-Type 纳入签名，
    // 但前端 PUT 时携带了 Content-Type，就会出现 SignatureDoesNotMatch。
    // 因此默认不主动设置 headers；若后端返回了明确要求的 headers，则按返回值设置。
    const extraHeaders: Record<string, string> = {}
    if (data.headers && typeof data.headers === 'object') {
      for (const [k, v] of Object.entries(data.headers)) {
        if (v != null) extraHeaders[String(k)] = String(v)
      }
    }

    // 用 XHR 才能拿到上传进度；fetch 目前无法可靠获得 upload progress
    const putResp = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      // 直传 OSS 一般不需要携带 cookie；显式关闭可避免部分环境下的跨域限制问题
      xhr.withCredentials = false
      for (const [k, v] of Object.entries(extraHeaders)) {
        xhr.setRequestHeader(k, v)
      }
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return
          const p = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)))
          onProgress(p)
        }
      }
      xhr.onload = () => {
        // 预签名 PUT 成功一般是 200/204
        const ok = xhr.status >= 200 && xhr.status < 300
        if (!ok) {
          const text = (xhr.responseText || '').slice(0, 1000)
          reject(new Error(`上传文件到 OSS 失败（HTTP ${xhr.status}）${text ? `：${text}` : ''}`))
          return
        }
        resolve(new Response(null, { status: xhr.status }))
      }
      xhr.onerror = () => {
        const text = (xhr.responseText || '').slice(0, 1000)
        reject(new Error(`上传文件到 OSS 失败（网络错误）${text ? `：${text}` : ''}`))
      }
      xhr.onabort = () => reject(new Error('上传已取消'))
      xhr.send(file)
    })
    if (!putResp.ok) throw new Error('上传文件到 OSS 失败')

    const objectUrl = data.objectUrl || data.location || uploadUrl.split('?')[0]
    return { objectUrl, key: data.key || data.filename }
  },

  // 旧实现：使用后端代传接口（multipart）上传，后端返回的结构以接口为准
  // 保留为内部实现，避免改动风险。
  _uploadViaServerImpl: async (file: File, folder = ''): Promise<any> => {
    const req = await OSSApiFp(apiConfig).apiOssUploadFolderPostForm(folder || 'uploads', file as any)
    const res = await req()
    return res.data.data
  },

  // 对外：后端代传上传（当前项目接口无法稳定拿到 progress，所以这里先做“尽力而为”）
  // 若未来后端提供可走 XHR 的 multipart endpoint，我们再把这里升级成真实 onprogress。
  uploadViaServer: async (file: File, folder: string, onProgress?: (percent: number) => void): Promise<any> => {
    const res = await (ossApiWrapper as any)._uploadViaServerImpl(file, folder)
    if (onProgress) onProgress(100)
    return res
  }
}

// NOTE: uploadToOss is exposed on videoApi earlier in this file.

// 志愿者相关API
export const volunteerApi = {
  // 获取志愿者列表
  getVolunteers: async (params?: any): Promise<Volunteer[]> => {
    const mapVolunteerStatus = (raw: any): 'active' | 'inactive' | 'frozen' => {
      const v = String(raw || '').toUpperCase()
      // user.status（ACTIVE/FROZEN/INACTIVE）
      if (v === 'ACTIVE') return 'active'
      if (v === 'FROZEN' || v === 'SUSPENDED') return 'frozen'
      // volunteer profile.status（IN_SCHOOL/GRADUATED 等）
      if (v === 'IN_SCHOOL') return 'active'
      if (v === 'GRADUATED') return 'inactive'
      return 'inactive'
    }

    const mapGender = (raw: any): 'male' | 'female' | any => {
      if (raw == null) return 'male'
      const v = String(raw).toUpperCase()
      if (v === 'F' || v === 'FEMALE' || v === '女') return 'female'
      if (v === 'M' || v === 'MALE' || v === '男') return 'male'
      return ''
    }

    const req = await UsersApiFp(apiConfig).apiUsersVolunteersGet(
      params?.collegeId,
      params?.status,
      params?.userStatus,
      params?.search,
      params?.page,
      params?.pageSize
    )
    const res = await req()

    // 兼容后端不同返回结构：
    // - res.data.data 为数组（常见）
    // - res.data 为数组
    // - res.data.data 为分页对象 { items: [] } / { list: [] }
    const payload: any = res?.data?.data ?? res?.data
    const list: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.list)
          ? payload.list
          : []

    return list.map((v: any) => {
      // swagger 示例是“志愿者档案(profile)”结构：
      // { userId, realName, studentId, collegeId, phone, status(IN_SCHOOL), user{...}, college{...} }
      const user = v.user || {}
      const college = v.college || v.collegeInfo || {}
      const createdAtRaw = user.createdAt || v.createdAt

      return {
        id: user.id ?? v.userId ?? v.id,
        username: user.username || v.username || '',
        studentId: v.studentId || user.username || '',
        name: v.realName || v.name || user.realName || user.name || '',
        gender: mapGender(v.gender ?? user.gender),
        collegeId: v.collegeId ?? college.id,
        collegeName: college.name || v.collegeName || '',
        phone: v.phone || user.phone || '',
        email: v.email || user.email || '',
        status: mapVolunteerStatus(user.status ?? v.status),
        createdAt: createdAtRaw ? new Date(createdAtRaw).toISOString() : new Date().toISOString()
      } as any
    })
  },
  
  // 创建志愿者
  createVolunteer: async (data: Partial<Volunteer>): Promise<Volunteer> => {
    // 确保所有必填字段都有有效值，不传递 collegeId（学院管理员自动使用自身学院）
    const payload = {
      username: (data as any).username || data.studentId || '',
      password: (data as any).password || '123456',
      realName: (data as any).realName || data.name || '',
      studentId: data.studentId || '',
      phone: data.phone || ''
    }

    console.log('🔥 NEW - 创建志愿者 payload (已移除 collegeId):', JSON.stringify(payload, null, 2))

    try {
      const req = await UsersApiFp(apiConfig).apiUsersVolunteersAccountsPost(payload)
      const res = await req()
      const u: any = res.data.data
      return {
        id: u.id,
        studentId: u.studentId || u.username || '',
        name: u.name || '',
        gender: u.gender === 'F' ? 'female' : 'male',
        collegeId: u.collegeId,
        collegeName: u.college?.name || '',
        phone: u.phone || '',
        email: u.email || '',
        status: u.status === 'ACTIVE' ? 'active' : u.status === 'FROZEN' ? 'frozen' : 'inactive',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
      }
    } catch (e: any) {
      console.error('❌ 创建志愿者失败:', e)
      if (e.response) {
        console.error('❌ 错误详情:', {
          status: e.response.status,
          statusText: e.response.statusText,
          data: e.response.data
        })
      }
      // 若 accountsPost 不可用/失败，尝试单个创建（若存在对应接口）
      // TODO: 若单个创建接口存在，可在这里回退实现。
      throw e
    }
  }

  ,

  // 启用/停用（状态变更）
  setVolunteerStatus: async (id: number, status: 'IN_SCHOOL' | 'SUSPENDED' | 'GRADUATED'): Promise<void> => {
    const payload = { status }
    console.log(`🔄 修改志愿者状态 - ID: ${id}, 新状态:`, payload)
    
    try {
      const req = await UsersApiFp(apiConfig).apiUsersVolunteersIdStatusPatch(String(id), payload as any)
      await req()
      console.log(`✅ 志愿者 ${id} 状态修改成功`)
    } catch (error: any) {
      console.error(`❌ 志愿者 ${id} 状态修改失败:`, error)
      if (error.response) {
        console.error('❌ 错误详情:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        })
      }
      throw error
    }
  },

  // 批量导入志愿者（逐条创建）
  importVolunteers: async (list: Array<Partial<Volunteer>>): Promise<Volunteer[]> => {
    const created: Volunteer[] = []
    for (const row of list) {
      // 尽量复用 createVolunteer 的字段映射
      const v = await volunteerApi.createVolunteer(row)
      created.push(v)
    }
    return created
  }
}

// 儿童账号相关API
export const childApi = {
  // 获取儿童列表
  getChildren: async (params?: any): Promise<Child[]> => {
    const req = await UsersApiFp(apiConfig).apiUsersChildrenGet(
      params?.search,
      params?.school,
      params?.grade,
      params?.page,
      params?.pageSize
    )
    const res = await req()
    // 兼容后端不同返回结构：
    // - res.data.data 为数组（常见）
    // - res.data 为数组（少数接口直接返回数组）
    // - res.data.data 为分页对象 { list: [] } 或 { items: [] }
    // - res.data.data 为单对象（单条）
    let list: any = []
    try {
      const payload = res?.data?.data ?? res?.data
      if (Array.isArray(payload)) {
        list = payload
      } else if (payload == null) {
        list = []
      } else if (Array.isArray(payload.list)) {
        list = payload.list
      } else if (Array.isArray(payload.items)) {
        list = payload.items
      } else if (typeof payload === 'object') {
        // 单个对象，包成数组
        list = [payload]
      } else {
        list = []
      }
    } catch (e) {
      console.warn('childApi.getChildren: 解析响应数据失败，返回空数组', e)
      list = []
    }

    if (!Array.isArray(list)) {
      console.warn('childApi.getChildren: 期望数组但得到非数组数据，已转换为数组', list)
      list = []
    }

    const mapGender = (raw: any): 'male' | 'female' | any => {
      if (raw == null) return 'male'
      const v = String(raw).toUpperCase()
      if (v === 'F' || v === 'FEMALE' || v === '女') return 'female'
      if (v === 'M' || v === 'MALE' || v === '男') return 'male'
      // 兜底：平台端页面会显示“未知”
      return ''
    }

    const mapStatus = (raw: any): 'active' | 'inactive' => {
      const v = String(raw || '').toUpperCase()
      return v === 'ACTIVE' ? 'active' : 'inactive'
    }

    return list.map((c: any) => {
      const profile = c.childProfile || c.profile || {}
      const createdAt = c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()

      return {
        id: c.id,
        username: c.username,
        // 平台端 children 接口：真实业务字段在 childProfile
        name: profile.realName || c.realName || c.name || '',
        gender: mapGender(profile.gender ?? c.gender),
        grade: profile.grade || c.grade || '',
        school: profile.school || c.school || '',
        // 儿童无学院：这里保留字段但为空，页面已不展示学院
        collegeId: c.collegeId ?? null,
        collegeName: c.college?.name || '',
        status: mapStatus(c.status),
        createdAt
      }
    })
  },

  // 更新儿童账号（当前页面只编辑姓名/性别/年级/学校）
  updateChild: async (
    _id: number,
    _patch: { realName?: string; gender?: 'male' | 'female'; grade?: string; school?: string }
  ): Promise<void> => {
    // OpenAPI 目前未暴露 children PATCH /{id}，因此用“批量创建/单个创建”不可行。
    // 若后端未来提供 children patch，请替换这里。
    // 这里先兜底：不支持更新时抛出可读错误，避免页面静默成功。
    throw new Error('后端暂未提供儿童账号编辑接口（仅支持批量导入/状态变更）')
  },

  // 启用/停用儿童账号
  setChildStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<void> => {
    const req = await UsersApiFp(apiConfig).apiUsersChildrenIdStatusPatch(String(id), { status } as any)
    await req()
  },
  
  // 批量导入儿童账号
  importChildren: async (file: File): Promise<any> => {
    // 目前 swagger/autogen 已提供 Excel 上传接口：/api/users/children/batch-excel
    // 调用后端的 multipart 上传接口，后端会返回导入结果
    try {
      const req = await UsersApiFp(apiConfig).apiUsersChildrenBatchExcelPostForm(file as any, { params: {} } as any)
      const res = await req()
      return res.data.data
    } catch (e) {
      // 把错误抛给调用方展示
      throw e
    }
  }
  ,
  // 下载儿童导入模板（后端提供的Excel模板）
  downloadChildrenTemplate: async (): Promise<void> => {
    try {
      // 关键：必须显式指定 responseType，否则 axios 可能按 JSON/text 解码，导致 xlsx 内容损坏
      const req = await UsersApiFp(apiConfig).apiUsersChildrenBatchExcelTemplateGet({ responseType: 'arraybuffer' } as any)
      const res = await req()

      // 尽量从响应头中拿文件名（若后端设置了 Content-Disposition）
      const cd: string | undefined = (res.headers as any)?.['content-disposition']
      const match = cd ? cd.match(/filename\*?=(?:UTF-8''|\")?([^;\"\n]+)/i) : null
      const filename = match ? decodeURIComponent(match[1].replace(/^"|"$/g, '')) : '儿童账号导入模板.xlsx'

      const blob = new Blob([res.data as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      throw e
    }
  }

  ,

  // 查看儿童账号真实密码（平台管理员）
  getChildPassword: async (id: number): Promise<string> => {
    const req = await ChildrenApiFp(apiConfig).apiChildrenIdPasswordGet(String(id))
    const res = await req()
    const payload: any = res?.data?.data ?? res?.data
    // 兼容不同返回结构：{ password } 或直接 string
    return (payload?.password ?? payload?.data?.password ?? payload) as string
  },

  // 修改儿童账号密码（平台管理员）
  setChildPassword: async (id: number, password: string): Promise<void> => {
    const req = await ChildrenApiFp(apiConfig).apiChildrenIdPasswordPost(String(id), { newPassword: password })
    await req()
  }
}

// 平台管理员的“查看/修改学院管理员密码”API
export const platformPasswordApi = {
  getCollegeAdminPassword: async (id: number): Promise<string> => {
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdPasswordGet(String(id))
    const res = await req()
    const payload: any = res?.data?.data ?? res?.data
    return (payload?.password ?? payload?.data?.password ?? payload) as string
  },

  setCollegeAdminPassword: async (id: number, password: string): Promise<void> => {
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdPasswordPost(String(id), { newPassword: password })
    await req()
  }
}

// 学院相关API
export const collegeApi = {
  // 获取学院列表
  getColleges: async (): Promise<College[]> => {
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegesGet()
    const res = await req()
    const list = res.data.data || []
    // 直接使用后端返回字段（isActive, sortOrder）与前端类型保持一致
    return list.map((c: any) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive ?? (c.enabled ?? true),
      sortOrder: c.sortOrder ?? c.sort ?? 0
    }))
  }
  ,
  // 批量导入学院管理员：接收解析好的数组并逐条调用创建接口（后端若支持批量，请替换为批量接口）
  importAdmins: async (rows: Array<any>): Promise<any> => {
    try {
      const tasks = rows.map(async (item) => {
        const payload = {
          realName: item.name || '',
          username: item.username || item.workId || '',
          collegeId: item.collegeId || undefined,
          password: item.password || '123456'
        }
        const reqFn = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsPost(payload as any)
        const r: any = await reqFn()
        return r.data
      })
      const results = await Promise.all(tasks)
      return results
    } catch (e) {
      console.warn('collegeApi.importAdmins: 批量创建学院管理员失败', e)
      throw e
    }
  }
  ,
  // 创建学院
  // 创建学院：接受与后端一致的字段命名（isActive, sortOrder）
  createCollege: async (data: { name: string; sortOrder?: number; isActive?: boolean }): Promise<College> => {
    const body = {
      name: data.name,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true
    } as any
    const reqFn = await PlatformApiFp(apiConfig).apiPlatformCollegesPost(body)
    const res: any = await reqFn()
    const c: any = res.data?.data || res.data
    return {
      id: c.id,
      name: c.name,
      isActive: c.isActive ?? (c.enabled ?? true),
      sortOrder: c.sortOrder ?? c.sort ?? 0
    }
  },

  // 更新学院（部分更新）
  updateCollege: async (id: number, data: { name?: string; sortOrder?: number; isActive?: boolean }): Promise<College> => {
    const body: any = {}
    if (data.name !== undefined) body.name = data.name
    if (data.sortOrder !== undefined) body.sortOrder = data.sortOrder
    if (data.isActive !== undefined) body.isActive = data.isActive
    const reqFn = await PlatformApiFp(apiConfig).apiPlatformCollegesIdPatch(String(id), body)
    const res: any = await reqFn()
    const c: any = res.data?.data || res.data
    return {
      id: c.id,
      name: c.name,
      isActive: c.isActive ?? (c.enabled ?? true),
      sortOrder: c.sortOrder ?? c.sort ?? 0
    }
  }
}

// 审核相关API
export const reviewApi = {
  // 审核视频
  reviewVideo: async (id: number, action: 'approve' | 'reject', reason?: string): Promise<void> => {
    const req = await VideosApiFp(apiConfig).apiVideosIdAuditPost(String(id), {
      pass: action === 'approve',
      reason: action === 'reject' ? (reason || '') : undefined
    } as any)
    await req()
  },
  
  // 审核直播
  reviewLive: async (id: number, action: 'approve' | 'reject', reason?: string): Promise<void> => {
    const req = await LiveApiFp(apiConfig).apiLiveIdAuditPost(String(id), {
      status: action === 'approve' ? 'PASSED' : 'REJECTED',
      rejectReason: action === 'reject' ? (reason || '') : undefined
    } as any)
    await req()
  }
}

// 审计日志API
export const auditApi = {
  // 获取审计日志
  getAuditLogs: async (params?: any): Promise<{ items: AuditLog[]; total: number; page: number; pageSize: number }> => {
    const req = await PlatformApiFp(apiConfig).apiPlatformAuditLogsGet(
      params?.collegeId,
      params?.action,
      params?.operatorId,
      params?.targetType,
      params?.targetId,
      params?.startTime,
      params?.endTime,
      params?.page,
      params?.pageSize
    )
    const res = await req()
    const payload: any = res.data?.data ?? res.data

    const page = Number(payload?.page ?? params?.page ?? 1)
    const pageSize = Number(payload?.pageSize ?? params?.pageSize ?? 20)
    const total = Number(payload?.total ?? 0)

    const rawItems: any = payload?.items ?? payload?.list ?? payload?.records ?? payload?.data ?? payload
    const list: any[] = Array.isArray(rawItems) ? rawItems : []
    if (!Array.isArray(rawItems)) {
      console.warn('getAuditLogs: 后端返回的数据不是数组:', rawItems)
    }

    const items = list.map((a: any) => ({
      id: a.id,
      userId: a.operatorId ?? 0,
      userName: a.operatorName ?? a.operator?.name ?? '',
      role: a.operatorRole ?? a.operator?.role ?? '',
      action: a.action ?? '',
      resourceType: a.targetType ?? '',
      resourceId: Number(a.targetId ?? 0),
      details: a.detail ?? '',
      ip: a.clientIp ?? a.ip ?? '',
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString()
    }))

    return { items, total, page, pageSize }
  }
}

// 认证相关API
export const authApi = {
  // 登录
  login: async (username: string, password: string): Promise<{ token: string; user: any }> => {
    // Login.vue 已直接使用 AuthApiFp，这里保留给其它地方调用时用
    const { AuthApiFp } = await import('@/api-services/apis/auth-api')
    const req = await AuthApiFp().apiAuthLoginPost({ username, password } as any)
    const res = await req()
    return { token: res.data.data.token, user: res.data.data.user }
  },
  
  // 登出
  logout: async (): Promise<void> => {
    const { AuthApiFp } = await import('@/api-services/apis/auth-api')
    const req = await AuthApiFp(apiConfig).apiAuthLogoutPost()
    await req()
  }
}

export default {
  videoApi,
  liveApi,
  volunteerApi,
  childApi,
  collegeApi,
  reviewApi,
  auditApi,
  authApi
}


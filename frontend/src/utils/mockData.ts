/**
 * 硬编码数据 - 用于前端开发阶段
 * 待后端接口完成后，将使用axios调用真实API替换
 */

// 视频状态枚举
export enum VideoStatus {
  DRAFT = 'draft',           // 草稿
  REVIEWING = 'reviewing',   // 审核中
  APPROVED = 'approved',     // 审核通过
  REJECTED = 'rejected',     // 审核驳回
  PUBLISHED = 'published',   // 已上架
  OFFLINE = 'offline'        // 已下架
}

// 直播状态枚举
export enum LiveStatus {
  DRAFT = 'draft',           // 草稿
  REVIEWING = 'reviewing',   // 审核中
  APPROVED = 'approved',     // 审核通过
  PUBLISHED = 'published',   // 已上架（预直播）
  LIVE = 'live',             // 直播中
  ENDED = 'ended',           // 已结束
  REJECTED = 'rejected',     // 审核驳回
  OFFLINE = 'offline'        // 已下架
}

// 视频接口
export interface Video {
  id: number
  title: string
  description: string
  coverUrl: string
  videoUrl: string
  duration: number
  grade: string[]
  subject: string
  tags: string[]
  status: VideoStatus
  volunteerId: number
  volunteerName: string
  collegeId: number
  collegeName: string
  playCount: number
  likeCount: number
  collectCount: number
  createdAt: string
  updatedAt: string
  reviewReason?: string
  reviewTime?: string
  reviewerName?: string
}

// 直播接口
export interface Live {
  id: number
  title: string
  description: string
  startTime: string
  duration: number
  grade: string[]
  subject: string
  estimatedViewers: number
  status: LiveStatus
  volunteerId: number
  volunteerName: string
  collegeId: number
  collegeName: string
  peakViewers: number
  averageViewers: number
  createdAt: string
  reviewReason?: string
  reviewTime?: string
  reviewerName?: string
}

// 志愿者接口
export interface Volunteer {
  id: number
  studentId: string
  name: string
  gender: 'male' | 'female'
  collegeId: number
  collegeName: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'frozen'
  createdAt: string
}

// 儿童账号接口
export interface Child {
  id: number
  username: string
  name: string
  gender: 'male' | 'female'
  grade: string
  school: string
  collegeId: number
  collegeName: string
  status: 'active' | 'inactive'
  createdAt: string
}

// 学院接口
export interface College {
  id: number
  name: string
  // 与后端 OpenAPI 对齐：isActive 表示是否启用
  isActive: boolean
  // 与后端 OpenAPI 对齐：sortOrder 表示排序
  sortOrder: number
}

// 审核日志接口
export interface AuditLog {
  id: number
  userId: number
  userName: string
  role: string
  action: string
  resourceType: string
  resourceId: number
  details: string
  ip: string
  createdAt: string
}

// Mock数据
export const mockVideos: Video[] = [
  {
    id: 1,
    title: '小学数学基础：加减法',
    description: '通过生动有趣的动画，帮助小学生掌握加减法的基本概念和运算方法。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video1.mp4',
    duration: 1200,
    grade: ['一年级', '二年级'],
    subject: '数学',
    tags: ['基础', '加减法'],
    status: VideoStatus.PUBLISHED,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    playCount: 1250,
    likeCount: 89,
    collectCount: 45,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    reviewTime: '2024-01-11T09:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 2,
    title: '语文阅读：古诗词欣赏',
    description: '带领孩子们欣赏经典古诗词，培养文学素养。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video2.mp4',
    duration: 1800,
    grade: ['三年级', '四年级'],
    subject: '语文',
    tags: ['阅读', '古诗词'],
    status: VideoStatus.REVIEWING,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    playCount: 0,
    likeCount: 0,
    collectCount: 0,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 3,
    title: '英语启蒙：26个字母',
    description: '通过歌曲和游戏学习英文字母。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video3.mp4',
    duration: 900,
    grade: ['一年级'],
    subject: '英语',
    tags: ['启蒙', '字母'],
    status: VideoStatus.REJECTED,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    playCount: 0,
    likeCount: 0,
    collectCount: 0,
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T15:00:00Z',
    reviewReason: '内容不符合年级要求，建议调整',
    reviewTime: '2024-01-14T15:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 4,
    title: '科学实验：水的循环',
    description: '通过实验了解水的循环过程。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video4.mp4',
    duration: 1500,
    grade: ['四年级', '五年级'],
    subject: '科学',
    tags: ['实验', '自然'],
    status: VideoStatus.DRAFT,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    playCount: 0,
    likeCount: 0,
    collectCount: 0,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  },
  {
    id: 5,
    title: '美术创作：色彩搭配',
    description: '学习基本的色彩搭配技巧。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video5.mp4',
    duration: 2000,
    grade: ['三年级', '四年级'],
    subject: '美术',
    tags: ['创作', '色彩'],
    status: VideoStatus.APPROVED,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    playCount: 0,
    likeCount: 0,
    collectCount: 0,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T14:00:00Z',
    reviewTime: '2024-01-17T14:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 6,
    title: '历史故事：古代文明',
    description: '了解古代文明的发展历程。',
    coverUrl: 'https://via.placeholder.com/300x200',
    videoUrl: 'https://example.com/video6.mp4',
    duration: 1800,
    grade: ['五年级', '六年级'],
    subject: '历史',
    tags: ['历史', '文明'],
    status: VideoStatus.OFFLINE,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    playCount: 500,
    likeCount: 30,
    collectCount: 15,
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-15T16:00:00Z',
    reviewTime: '2024-01-13T15:00:00Z',
    reviewerName: '李管理员'
  }
]

export const mockLives: Live[] = [
  {
    id: 1,
    title: '数学趣味课堂：图形认知',
    description: '通过互动游戏学习各种图形',
    startTime: '2024-01-20T14:00:00Z',
    duration: 3600,
    grade: ['一年级', '二年级'],
    subject: '数学',
    estimatedViewers: 50,
    status: LiveStatus.APPROVED,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: '2024-01-18T10:00:00Z',
    reviewTime: '2024-01-18T15:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 2,
    title: '语文阅读分享会',
    description: '分享有趣的儿童故事',
    startTime: '2024-01-22T10:00:00Z',
    duration: 2700,
    grade: ['三年级', '四年级'],
    subject: '语文',
    estimatedViewers: 30,
    status: LiveStatus.REVIEWING,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: '2024-01-19T09:00:00Z'
  },
  {
    id: 3,
    title: '科学探索：植物生长',
    description: '观察植物生长的过程',
    startTime: '2024-01-25T14:00:00Z',
    duration: 3600,
    grade: ['四年级', '五年级'],
    subject: '科学',
    estimatedViewers: 40,
    status: LiveStatus.DRAFT,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 4,
    title: '英语口语练习',
    description: '日常英语对话练习',
    startTime: '2024-01-23T15:00:00Z',
    duration: 2700,
    grade: ['五年级', '六年级'],
    subject: '英语',
    estimatedViewers: 35,
    status: LiveStatus.PUBLISHED,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: '2024-01-21T09:00:00Z',
    reviewTime: '2024-01-21T14:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 5,
    title: '数学思维训练',
    description: '培养数学思维能力',
    startTime: '2024-01-21T10:00:00Z',
    duration: 3600,
    grade: ['三年级', '四年级'],
    subject: '数学',
    estimatedViewers: 45,
    status: LiveStatus.LIVE,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    peakViewers: 52,
    averageViewers: 38,
    createdAt: '2024-01-19T10:00:00Z',
    reviewTime: '2024-01-19T15:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 6,
    title: '美术创作指导',
    description: '学习绘画技巧',
    startTime: '2024-01-18T14:00:00Z',
    duration: 2700,
    grade: ['二年级', '三年级'],
    subject: '美术',
    estimatedViewers: 25,
    status: LiveStatus.ENDED,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    peakViewers: 28,
    averageViewers: 22,
    createdAt: '2024-01-17T10:00:00Z',
    reviewTime: '2024-01-17T15:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 7,
    title: '音乐欣赏：古典音乐',
    description: '欣赏经典古典音乐作品',
    startTime: '2024-01-24T16:00:00Z',
    duration: 3600,
    grade: ['四年级', '五年级'],
    subject: '音乐',
    estimatedViewers: 30,
    status: LiveStatus.REJECTED,
    volunteerId: 1,
    volunteerName: '张同学',
    collegeId: 1,
    collegeName: '数学学院',
    peakViewers: 0,
    averageViewers: 0,
    createdAt: '2024-01-20T10:00:00Z',
    reviewReason: '内容不符合要求',
    reviewTime: '2024-01-20T15:00:00Z',
    reviewerName: '李管理员'
  },
  {
    id: 8,
    title: '体育游戏：趣味运动',
    description: '通过游戏进行体育锻炼',
    startTime: '2024-01-19T10:00:00Z',
    duration: 2700,
    grade: ['一年级', '二年级'],
    subject: '体育',
    estimatedViewers: 20,
    status: LiveStatus.OFFLINE,
    volunteerId: 2,
    volunteerName: '王同学',
    collegeId: 2,
    collegeName: '文学院',
    peakViewers: 15,
    averageViewers: 12,
    createdAt: '2024-01-16T10:00:00Z',
    reviewTime: '2024-01-16T15:00:00Z',
    reviewerName: '李管理员'
  }
]

export const mockVolunteers: Volunteer[] = [
  {
    id: 1,
    studentId: '2021001',
    name: '张同学',
    gender: 'male',
    collegeId: 1,
    collegeName: '数学学院',
    phone: '13800138001',
    email: 'zhang@example.com',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    studentId: '2021002',
    name: '王同学',
    gender: 'female',
    collegeId: 2,
    collegeName: '文学院',
    phone: '13800138002',
    email: 'wang@example.com',
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z'
  }
]

export const mockChildren: Child[] = [
  {
    id: 1,
    username: 'child001',
    name: '小明',
    gender: 'male',
    grade: '三年级',
    school: '希望小学',
    collegeId: 1,
    collegeName: '数学学院',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'child002',
    name: '小红',
    gender: 'female',
    grade: '二年级',
    school: '希望小学',
    collegeId: 1,
    collegeName: '数学学院',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const mockColleges: College[] = [
  { id: 1, name: '数学学院', isActive: true, sortOrder: 1 },
  { id: 2, name: '文学院', isActive: true, sortOrder: 2 },
  { id: 3, name: '外语学院', isActive: true, sortOrder: 3 }
]

export const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userName: '李管理员',
    role: 'college_admin',
    action: '审核通过',
    resourceType: 'video',
    resourceId: 1,
    details: '视频《小学数学基础：加减法》审核通过',
    ip: '192.168.1.100',
    createdAt: '2024-01-11T09:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    userName: '李管理员',
    role: 'college_admin',
    action: '审核驳回',
    resourceType: 'video',
    resourceId: 3,
    details: '视频《英语启蒙：26个字母》审核驳回，原因：内容不符合年级要求',
    ip: '192.168.1.100',
    createdAt: '2024-01-14T15:00:00Z'
  }
]


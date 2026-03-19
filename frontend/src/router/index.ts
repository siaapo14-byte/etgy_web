import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  // 志愿者端路由
  {
    path: '/volunteer',
    component: () => import('@/layouts/VolunteerLayout.vue'),
    meta: { requiresAuth: true, role: 'volunteer' },
    children: [
      {
        path: '',
        redirect: '/volunteer/videos'
      },
      {
        path: 'videos',
        name: 'VolunteerVideos',
        component: () => import('@/views/volunteer/Videos.vue'),
        meta: { title: '我的视频' }
      },
      {
        path: 'videos/upload',
        name: 'VolunteerVideoUpload',
        component: () => import('@/views/volunteer/VideoUpload.vue'),
        meta: { title: '上传视频' }
      },
      {
        path: 'live',
        name: 'VolunteerLive',
        component: () => import('@/views/volunteer/Live.vue'),
        meta: { title: '直播申请' }
      },
      {
        path: 'statistics',
        name: 'VolunteerStatistics',
        component: () => import('@/views/volunteer/Statistics.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'profile',
        name: 'VolunteerProfile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人资料' }
      }
    ]
  },
  // 学院管理员端路由
  {
    path: '/college-admin',
    component: () => import('@/layouts/CollegeAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'college_admin' },
    children: [
      {
        path: '',
        redirect: '/college-admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'CollegeDashboard',
        component: () => import('@/views/college-admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'videos/review',
        name: 'CollegeVideoReview',
        component: () => import('@/views/college-admin/VideoReview.vue'),
        meta: { title: '视频审核' }
      },
      {
        path: 'live/review',
        name: 'CollegeLiveReview',
        component: () => import('@/views/college-admin/LiveReview.vue'),
        meta: { title: '直播审核' }
      },
      {
        path: 'volunteers',
        name: 'CollegeVolunteers',
        component: () => import('@/views/college-admin/Volunteers.vue'),
        meta: { title: '志愿者管理' }
      },
      {
        path: 'videos/manage',
        name: 'CollegeVideoManage',
        component: () => import('@/views/college-admin/VideoManage.vue'),
        meta: { title: '视频状态管理' }
      },
        {
          path: 'audit',
          name: 'CollegeAudit',
          component: () => import('@/views/college-admin/AuditLog.vue'),
          meta: { title: '审计日志' }
        },
        {
          path: 'profile',
          name: 'CollegeProfile',
          component: () => import('@/views/Profile.vue'),
          meta: { title: '个人资料' }
        }
    ]
  },
  // 平台管理员端路由
  {
    path: '/platform-admin',
    component: () => import('@/layouts/PlatformAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'platform_admin' },
    children: [
      {
        path: '',
        redirect: '/platform-admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'PlatformDashboard',
        component: () => import('@/views/platform-admin/Dashboard.vue'),
        meta: { title: '全局仪表盘' }
      },
      {
        path: 'videos',
        name: 'PlatformVideos',
        component: () => import('@/views/platform-admin/Videos.vue'),
        meta: { title: '全局视频管理' }
      },
      {
        path: 'live',
        name: 'PlatformLive',
        component: () => import('@/views/platform-admin/Live.vue'),
        meta: { title: '全局直播管理' }
      },
      {
        path: 'colleges',
        name: 'PlatformColleges',
        component: () => import('@/views/platform-admin/Colleges.vue'),
        meta: { title: '学院管理' }
      },
      {
        path: 'college-admins',
        name: 'PlatformCollegeAdmins',
        component: () => import('@/views/platform-admin/CollegeAdmins.vue'),
        meta: { title: '学院管理员管理' }
      },
      {
        path: 'children',
        name: 'PlatformChildren',
        component: () => import('@/views/platform-admin/Children.vue'),
        meta: { title: '儿童账号建档' }
      },
      {
        path: 'audit',
        name: 'PlatformAudit',
        component: () => import('@/views/platform-admin/AuditLog.vue'),
        meta: { title: '全局审计日志' }
      },
      {
        path: 'alerts',
        name: 'PlatformAlerts',
        component: () => import('@/views/platform-admin/Alerts.vue'),
        meta: { title: '风险告警' }
      },
      {
        path: 'profile',
        name: 'PlatformProfile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人资料' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 优先从sessionStorage读取（支持多标签页不同账号）
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }
    
    // 检查角色权限
    if (to.meta.role && user.role !== to.meta.role) {
      ElMessage.error('无权限访问该页面')
      // 根据用户角色跳转到对应首页
      if (user.role === 'volunteer') {
        next('/volunteer')
      } else if (user.role === 'college_admin') {
        next('/college-admin')
      } else if (user.role === 'platform_admin') {
        next('/platform-admin')
      } else {
        next('/login')
      }
      return
    }
  }
  
  // 已登录用户访问登录页，跳转到对应首页
  if (to.path === '/login' && token && user) {
    if (user.role === 'volunteer') {
      next('/volunteer')
    } else if (user.role === 'college_admin') {
      next('/college-admin')
    } else if (user.role === 'platform_admin') {
      next('/platform-admin')
    } else {
      next()
    }
    return
  }
  
  next()
})

export default router


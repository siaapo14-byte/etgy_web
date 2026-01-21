<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <Logo />
      </div>
      <div class="header-right">
        <el-button type="text" @click="$router.push('/platform-admin/profile')">
          <el-icon><User /></el-icon>
          <span style="margin-left: 5px">{{ userStore.user?.name }}</span>
        </el-button>
        <el-button type="text" @click="handleLogout">退出</el-button>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="220px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/platform-admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>全局仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/videos">
            <el-icon><VideoPlay /></el-icon>
            <span>全局视频管理</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/live">
            <el-icon><VideoCamera /></el-icon>
            <span>全局直播管理</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/colleges">
            <el-icon><School /></el-icon>
            <span>学院管理</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/college-admins">
            <el-icon><User /></el-icon>
            <span>学院管理员管理</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/children">
            <el-icon><UserFilled /></el-icon>
            <span>儿童账号建档</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/audit">
            <el-icon><Document /></el-icon>
            <span>全局审计日志</span>
          </el-menu-item>
          <el-menu-item index="/platform-admin/alerts">
            <el-icon><Warning /></el-icon>
            <span>风险告警</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import Logo from '@/components/Logo.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
  }
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  
  .sidebar-menu {
    border-right: none;
    height: 100%;
  }
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>


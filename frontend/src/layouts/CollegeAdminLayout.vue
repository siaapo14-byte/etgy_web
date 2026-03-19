<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <Logo />
        <span class="college-name" v-if="userStore.user?.collegeName">
          {{ userStore.user.collegeName }}
        </span>
      </div>
      <div class="header-right">
        <el-button type="text" @click="$router.push('/college-admin/profile')">
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
          <el-menu-item index="/college-admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/college-admin/videos/review">
            <el-icon><DocumentChecked /></el-icon>
            <span>视频审核</span>
          </el-menu-item>
          <el-menu-item index="/college-admin/live/review">
            <el-icon><VideoCamera /></el-icon>
            <span>直播审核</span>
          </el-menu-item>
          <el-menu-item index="/college-admin/volunteers">
            <el-icon><User /></el-icon>
            <span>志愿者管理</span>
          </el-menu-item>
          <el-menu-item index="/college-admin/videos/manage">
            <el-icon><VideoPlay /></el-icon>
            <span>视频状态管理</span>
          </el-menu-item>
          <el-menu-item index="/college-admin/audit">
            <el-icon><Document /></el-icon>
            <span>审计日志</span>
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
    gap: 15px;
  }
  
  .college-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    padding: 4px 12px;
    background: #f5f7fa;
    border-radius: 4px;
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


<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <Logo />
      </div>
      <div class="header-right">
        <el-button type="text" @click="$router.push('/volunteer/profile')">
          <el-icon><User /></el-icon>
          <span style="margin-left: 5px">{{ userStore.user?.name }}</span>
        </el-button>
        <el-button type="text" @click="handleLogout">退出</el-button>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/volunteer/videos">
            <el-icon><VideoPlay /></el-icon>
            <span>我的视频</span>
          </el-menu-item>
          <el-menu-item index="/volunteer/videos/upload">
            <el-icon><Upload /></el-icon>
            <span>上传视频</span>
          </el-menu-item>
          <el-menu-item index="/volunteer/live">
            <el-icon><VideoCamera /></el-icon>
            <span>直播申请</span>
          </el-menu-item>
          <el-menu-item index="/volunteer/statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
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


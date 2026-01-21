<template>
  <div class="logo-container">
    <img :src="logoUrl" alt="益路童行" class="logo-image" />
    <div class="logo-text">
      <div class="platform-name">益路童行</div>
      <div v-if="roleName" class="role-name">{{ roleName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

// 使用相对路径导入图片
const logoUrl = new URL('../../assets/a2e29b3a2052c932042c6169ed2f86d9.jpeg', import.meta.url).href

const userStore = useUserStore()

const roleName = computed(() => {
  const role = userStore.user?.role
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    college_admin: '学院管理员',
    platform_admin: '平台管理员'
  }
  return role ? roleMap[role] : ''
})
</script>

<style scoped lang="scss">
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .logo-image {
    height: 50px;
    width: auto;
    object-fit: contain;
  }
  
  .logo-text {
    display: flex;
    flex-direction: column;
    
    .platform-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      line-height: 1.2;
    }
    
    .role-name {
      font-size: 12px;
      color: #666;
      line-height: 1.2;
    }
  }
}
</style>

<template>
  <div class="live-page">
    <div class="page-header">
      <h2>全局直播管理</h2>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="学院">
            <el-select v-model="filters.collegeId" placeholder="全部" clearable style="width: 150px">
              <el-option
                v-for="college in colleges"
                :key="college.id"
                :label="college.name"
                :value="college.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="草稿" value="draft" />
              <el-option label="审核中" value="reviewing" />
              <el-option label="审核通过" value="approved" />
              <el-option label="审核驳回" value="rejected" />
              <el-option label="已上架" value="published" />
              <el-option label="直播中" value="live" />
              <el-option label="已结束" value="ended" />
              <el-option label="已下架" value="offline" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="主题/志愿者" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredLives" style="width: 100%">
        <el-table-column prop="title" label="主题" width="250" />
        <el-table-column prop="collegeName" label="学院" width="150" />
        <el-table-column prop="volunteerName" label="志愿者" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="peakViewers" label="峰值观看" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'live' || row.status === 'published'"
              type="danger"
              size="small"
              @click="handleBan(row)"
            >
              封停
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              size="small"
              @click="handleOffline(row)"
            >
              下架
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { liveApi, collegeApi } from '@/utils/api'
import type { Live, College } from '@/utils/mockData'
import { LiveApiFp } from '@/api-services/apis/live-api'
import { apiConfig } from '@/apiClient'

const lives = ref<Live[]>([])
const colleges = ref<College[]>([])
const filters = reactive({
  collegeId: null as number | null,
  status: '',
  keyword: ''
})

const filteredLives = computed(() => {
  let result = lives.value
  
  if (filters.collegeId) {
    result = result.filter(l => l.collegeId === filters.collegeId)
  }
  
  if (filters.status) {
    result = result.filter(l => l.status === filters.status)
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(l => 
      l.title.toLowerCase().includes(keyword) ||
      l.volunteerName.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    lives.value = await liveApi.getLives()
    colleges.value = await collegeApi.getColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    published: 'success',
    live: 'success',
    ended: 'info',
    offline: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    published: '已上架',
    live: '直播中',
    ended: '已结束',
    offline: '已下架'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  filters.collegeId = null
  filters.status = ''
  filters.keyword = ''
}

const handleBan = async (live: Live) => {
  try {
    await ElMessageBox.confirm('确定要封停这个直播吗？', '警告', {
      type: 'warning'
    })
    // 兼容：若后端有 ban 接口则调用，没有就暂用 offline 兜底
    const api = LiveApiFp(apiConfig) as any
    if (typeof api.apiLiveIdBanPost === 'function') {
      const req = await api.apiLiveIdBanPost(String(live.id))
      await req()
    } else {
      console.warn('[platform-admin/Live] apiLiveIdBanPost not found, fallback to offline')
      const req = await LiveApiFp(apiConfig).apiLiveIdOfflinePost(String(live.id))
      await req()
    }
    ElMessage.success('已封停')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleOffline = async (live: Live) => {
  try {
    await ElMessageBox.confirm('确定要下架这个直播吗？', '提示', {
      type: 'warning'
    })
    const req = await LiveApiFp(apiConfig).apiLiveIdOfflinePost(String(live.id))
    await req()
    ElMessage.success('已下架')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}
</script>

<style scoped lang="scss">
.live-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
  
  .filter-bar {
    margin-bottom: 20px;
  }
}
</style>


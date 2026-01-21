<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>数据统计</h2>
    </div>
    
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalVideos }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalPlays }}</div>
            <div class="stat-label">总播放量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalLikes }}</div>
            <div class="stat-label">总点赞数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.approvalRate }}%</div>
            <div class="stat-label">通过率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px">
      <template #header>
        <span>视频数据详情</span>
      </template>
      
      <el-table :data="videos" style="width: 100%">
        <el-table-column prop="title" label="视频标题" width="300" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="playCount" label="播放量" width="120" />
        <el-table-column prop="likeCount" label="点赞数" width="120" />
        <el-table-column prop="collectCount" label="收藏数" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { videoApi } from '@/utils/api'
import type { Video } from '@/utils/mockData'

const videos = ref<Video[]>([])

const statistics = computed(() => {
  const totalVideos = videos.value.length
  const totalPlays = videos.value.reduce((sum, v) => sum + v.playCount, 0)
  const totalLikes = videos.value.reduce((sum, v) => sum + v.likeCount, 0)
  const approvedCount = videos.value.filter(v => v.status === 'approved' || v.status === 'published').length
  const approvalRate = totalVideos > 0 ? Math.round((approvedCount / totalVideos) * 100) : 0
  
  return {
    totalVideos,
    totalPlays,
    totalLikes,
    approvalRate
  }
})

onMounted(async () => {
  await loadVideos()
})

const loadVideos = async () => {
  try {
    const data = await videoApi.getVideos()
    videos.value = data
  } catch (error: any) {
    console.error('加载视频列表失败', error)
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    published: 'success',
    offline: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '审核通过',
    rejected: '审核驳回',
    published: '已上架',
    offline: '已下架'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.statistics-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
  
  .stats-cards {
    margin-bottom: 20px;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 10px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
      }
    }
  }
}
</style>


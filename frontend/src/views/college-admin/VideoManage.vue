<template>
  <div class="manage-page">
    <div class="page-header">
      <h2>视频状态管理</h2>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="审核通过" value="approved" />
              <el-option label="已上架" value="published" />
              <el-option label="已下架" value="offline" />
            </el-select>
          </el-form-item>
          <el-form-item label="志愿者">
            <el-input v-model="filters.volunteer" placeholder="搜索志愿者" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredVideos" style="width: 100%">
        <el-table-column prop="title" label="标题" width="250" />
        <el-table-column prop="volunteerName" label="志愿者" width="120" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="playCount" label="播放量" width="100" />
        <el-table-column prop="createdAt" label="审核通过时间" width="180">
          <template #default="{ row }">
            {{ row.reviewTime ? formatDate(row.reviewTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'approved'"
              type="success"
              size="small"
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              size="small"
              @click="handleOffline(row)"
            >
              下线
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handlePreview(row)"
            >
              预览
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 下线对话框 -->
    <el-dialog
      v-model="offlineDialogVisible"
      title="下线理由"
      width="500px"
    >
      <el-form :model="offlineForm">
        <el-form-item label="下线理由">
          <el-input
            v-model="offlineForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入下线理由（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="offlineDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmOffline">确认下线</el-button>
      </template>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="视频详情"
      width="1200px"
    >
      <div v-if="currentPreviewVideo" class="video-detail">
        <el-row :gutter="20">
          <!-- 左侧：视频播放器 -->
          <el-col :span="12">
            <div style="background: #000; border-radius: 8px; position: sticky; top: 20px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; overflow: hidden">
              <video
                v-if="currentPreviewVideo.videoUrl"
                :src="currentPreviewVideo.videoUrl"
                controls
                style="width: 100%; height: 100%; object-fit: contain"
              >
                您的浏览器不支持视频播放
              </video>
              <div v-else style="color: #fff; padding: 60px; text-align: center">
                <el-icon style="font-size: 64px; margin-bottom: 20px"><VideoPlay /></el-icon>
                <p style="font-size: 16px">视频文件待上传</p>
              </div>
            </div>
          </el-col>
          
          <!-- 右侧：详情信息 -->
          <el-col :span="12">
            <el-descriptions :column="1" border :label-style="{ width: '100px', padding: '12px 0' }" :content-style="{ padding: '12px 0' }">
              <el-descriptions-item label="标题">
                {{ currentPreviewVideo.title }}
              </el-descriptions-item>
              <el-descriptions-item label="简介">
                {{ currentPreviewVideo.description }}
              </el-descriptions-item>
              <el-descriptions-item label="志愿者">
                {{ currentPreviewVideo.volunteerName }}
              </el-descriptions-item>
              <el-descriptions-item label="所属学院">
                {{ currentPreviewVideo.collegeName }}
              </el-descriptions-item>
              <el-descriptions-item label="学科">
                {{ currentPreviewVideo.subject }}
              </el-descriptions-item>
              <el-descriptions-item label="适用年级">
                <el-tag v-for="g in currentPreviewVideo.grade" :key="g" size="small" style="margin-right: 5px">
                  {{ g }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="标签">
                <el-tag v-for="tag in currentPreviewVideo.tags" :key="tag" size="small" style="margin-right: 5px">
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(currentPreviewVideo.status)">
                  {{ getStatusText(currentPreviewVideo.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="播放量">
                {{ currentPreviewVideo.playCount }}
              </el-descriptions-item>
              <el-descriptions-item label="点赞数">
                {{ currentPreviewVideo.likeCount }}
              </el-descriptions-item>
              <el-descriptions-item label="收藏数">
                {{ currentPreviewVideo.collectCount }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(currentPreviewVideo.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentPreviewVideo.reviewTime" label="审核时间">
                {{ formatDate(currentPreviewVideo.reviewTime) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentPreviewVideo.reviewerName" label="审核人">
                {{ currentPreviewVideo.reviewerName }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { videoApi } from '@/utils/api'
import type { Video } from '@/utils/mockData'

const videos = ref<Video[]>([])
const filters = reactive({
  status: '',
  volunteer: ''
})

const offlineDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const currentOfflineVideo = ref<Video | null>(null)
const currentPreviewVideo = ref<Video | null>(null)
const offlineForm = reactive({
  reason: ''
})

const filteredVideos = computed(() => {
  let result = videos.value.filter(v => 
    v.status === 'approved' || v.status === 'published' || v.status === 'offline'
  )
  
  if (filters.status) {
    result = result.filter(v => v.status === filters.status)
  }
  
  if (filters.volunteer) {
    result = result.filter(v => 
      v.volunteerName.includes(filters.volunteer)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadVideos()
})

const loadVideos = async () => {
  try {
    videos.value = await videoApi.getVideos()
  } catch (error: any) {
    ElMessage.error(error.message || '加载视频列表失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    approved: 'success',
    published: 'success',
    offline: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    approved: '审核通过',
    published: '已上架',
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
  filters.status = ''
  filters.volunteer = ''
}

const handlePublish = async (video: Video) => {
  try {
    await ElMessageBox.confirm('确定要发布这个视频吗？发布后儿童可见。', '提示', {
      type: 'warning'
    })
    await videoApi.togglePublish(video.id, 'publish')
    ElMessage.success('发布成功')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

const handleOffline = (video: Video) => {
  currentOfflineVideo.value = video
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmOffline = async () => {
  if (!offlineForm.reason.trim()) {
    ElMessage.warning('请输入下线理由')
    return
  }
  
  if (!currentOfflineVideo.value) return
  
  try {
    // 后端下线接口目前不接收 reason（OpenAPI: /videos/{id}/offline），这里先执行真实下线
    console.info('[college-admin/VideoManage] offline reason:', offlineForm.reason)
    await videoApi.togglePublish(currentOfflineVideo.value.id, 'offline')
    ElMessage.success('已下线')
    offlineDialogVisible.value = false
    currentOfflineVideo.value = null
    offlineForm.reason = ''
    await loadVideos()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handlePreview = (video: Video) => {
  previewDialogVisible.value = true
  currentPreviewVideo.value = video
}
</script>

<style scoped lang="scss">
.manage-page {
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


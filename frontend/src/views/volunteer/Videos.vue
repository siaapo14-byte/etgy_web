<template>
  <div class="videos-page">
    <div class="page-header">
      <h2>我的视频</h2>
      <el-button type="primary" @click="$router.push('/volunteer/videos/upload')">
        <el-icon><Plus /></el-icon>
        上传视频
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="videos" style="width: 100%">
        <el-table-column prop="title" label="标题" width="300" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="grade" label="年级" width="150">
          <template #default="{ row }">
            <el-tag v-for="g in row.grade" :key="g" size="small" style="margin-right: 5px">
              {{ g }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="playCount" label="播放量" width="100" />
        <el-table-column prop="likeCount" label="点赞数" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="success"
              size="small"
              @click="handleSubmitReview(row.id)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="row.status === 'approved'"
              type="success"
              size="small"
              @click="handlePublish(row.id)"
            >
              上架
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              size="small"
              @click="handleOffline(row.id)"
            >
              下架
            </el-button>
            <el-button
              v-if="row.status === 'rejected'"
              type="primary"
              size="small"
              @click="handleEdit(row.id)"
            >
              重新编辑
            </el-button>
            <el-button
              v-if="row.status === 'draft' || row.status === 'rejected'"
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="videos.length === 0" class="empty-state">
        <el-empty description="暂无视频，快去上传吧！" />
      </div>
    </el-card>
    
    <!-- 视频详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="视频详情"
      width="1200px"
    >
      <div v-if="currentVideo" class="video-detail">
        <el-row :gutter="20">
          <!-- 左侧：视频播放器 -->
          <el-col :span="12">
            <div style="background: #000; border-radius: 8px; position: sticky; top: 20px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; overflow: hidden">
              <video
                v-if="currentVideo.videoUrl"
                :src="currentVideo.videoUrl"
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
                {{ currentVideo.title }}
              </el-descriptions-item>
              <el-descriptions-item label="简介">
                {{ currentVideo.description }}
              </el-descriptions-item>
              <el-descriptions-item label="学科">
                {{ currentVideo.subject }}
              </el-descriptions-item>
              <el-descriptions-item label="适用年级">
                <el-tag v-for="g in currentVideo.grade" :key="g" size="small" style="margin-right: 5px">
                  {{ g }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="标签">
                <el-tag v-for="tag in currentVideo.tags" :key="tag" size="small" style="margin-right: 5px">
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(currentVideo.status)">
                  {{ getStatusText(currentVideo.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="播放量">
                {{ currentVideo.playCount }}
              </el-descriptions-item>
              <el-descriptions-item label="点赞数">
                {{ currentVideo.likeCount }}
              </el-descriptions-item>
              <el-descriptions-item label="收藏数">
                {{ currentVideo.collectCount }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(currentVideo.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentVideo.reviewTime" label="审核时间">
                {{ formatDate(currentVideo.reviewTime) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentVideo.reviewerName" label="审核人">
                {{ currentVideo.reviewerName }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentVideo.reviewReason" label="审核意见">
                <div style="color: #f56c6c">{{ currentVideo.reviewReason }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import type { Video, VideoStatusEnum } from '@/api-services/models'
import { apiConfig } from '@/apiClient'

// 前端展示用的 UI 类型，兼容原页面字段
type UiVideo = {
  id: number
  title: string
  description: string
  videoUrl: string
  coverUrl?: string | null
  grade: string[]
  subject: string
  tags: string[]
  status: VideoStatusEnum | string
  playCount: number
  likeCount: number
  collectCount: number
  createdAt: string
  reviewTime?: string
  reviewerName?: string
  reviewReason?: string
}

const videos = ref<UiVideo[]>([])
const detailDialogVisible = ref(false)
const currentVideo = ref<UiVideo | null>(null)

const adaptVideo = (v: Video): UiVideo => {
  return {
    id: v.id,
    title: v.title,
    description: v.intro || '',
    videoUrl: v.url,
    coverUrl: v.coverUrl,
    grade: v.gradeRange ? v.gradeRange.split(',').map(i => i.trim()).filter(Boolean) : [],
    subject: v.subjectTag || '',
    tags: [],
    status: v.status,
    playCount: v.metrics?.playCount ?? 0,
    likeCount: v.metrics?.likeCount ?? 0,
    collectCount: v.metrics?.favCount ?? 0,
    createdAt: new Date(v.createdAt).toISOString(),
    reviewTime: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : undefined,
    reviewerName: '', // 后端未提供，预留
    reviewReason: v.rejectReason || ''
  }
}

onMounted(async () => {
  await loadVideos()
})

const loadVideos = async () => {
  try {
    const req = await VideosApiFp(apiConfig).apiVideosGet()
    const res = await req()
    const list = res.data.data || []
    videos.value = list.map(adaptVideo)
  } catch (error: any) {
    ElMessage.error(error.message || '加载视频列表失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    PUBLISHED: 'success',
    OFFLINE: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    REVIEW: '审核中',
    APPROVED: '审核通过',
    REJECTED: '审核驳回',
    PUBLISHED: '已上架',
    OFFLINE: '已下架'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleString('zh-CN')
}

const handleSubmitReview = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', {
      type: 'warning'
    })
    const req = await VideosApiFp(apiConfig).apiVideosIdSubmitPost(String(id))
    await req()
    ElMessage.success('提交审核成功')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交审核失败')
    }
  }
}

const handlePublish = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要上架这个视频吗？', '提示', {
      type: 'warning'
    })
    const req = await VideosApiFp(apiConfig).apiVideosIdPublishPost(String(id))
    await req()
    ElMessage.success('上架成功')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '上架失败')
    }
  }
}

const handleOffline = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要下架这个视频吗？', '提示', {
      type: 'warning'
    })
    const req = await VideosApiFp(apiConfig).apiVideosIdOfflinePost(String(id))
    await req()
    ElMessage.success('下架成功')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '下架失败')
    }
  }
}

const handleEdit = () => {
  ElMessage.info('编辑功能开发中')
}

const handleDelete = async () => {
  ElMessage.warning('后端暂未提供删除接口')
}

const handleViewDetail = (video: UiVideo) => {
  detailDialogVisible.value = true
  currentVideo.value = video
}
</script>

<style scoped lang="scss">
.videos-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
  
  .empty-state {
    padding: 40px 0;
  }
}
</style>


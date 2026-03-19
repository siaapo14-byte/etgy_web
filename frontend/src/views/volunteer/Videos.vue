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
              v-if="isStatus(row.status, 'DRAFT')"
              type="success"
              size="small"
              @click="handleSubmitReview(row.id)"
            >
              提交审核
            </el-button>

            <el-button
              v-if="isStatus(row.status, 'DRAFT')"
              type="primary"
              size="small"
              @click="handleEdit(row.id)"
            >
              修改
            </el-button>
            <el-button
              v-if="isStatus(row.status, 'APPROVED')"
              type="success"
              size="small"
              @click="handlePublish(row.id)"
            >
              上架
            </el-button>
            <el-button
              v-if="isStatus(row.status, 'PUBLISHED')"
              type="warning"
              size="small"
              @click="handleOffline(row.id)"
            >
              下架
            </el-button>
            <el-button
              v-if="isStatus(row.status, 'REJECTED')"
              type="primary"
              size="small"
              @click="handleEdit(row.id)"
            >
              重新编辑
            </el-button>
            <el-button
              v-if="isStatus(row.status, 'DRAFT') || isStatus(row.status, 'REJECTED')"
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
    <VideoPreviewDialog v-model="detailDialogVisible" :video="currentVideo" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import type { Video, VideoStatusEnum } from '@/api-services/models'
import { apiConfig } from '@/apiClient'
import VideoPreviewDialog from '@/components/VideoPreviewDialog.vue'

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
const router = useRouter()

const isStatus = (s: any, target: string) => String(s || '').toUpperCase() === target

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
    // 关键：志愿者“我的视频”应走 /api/videos/mine
    // 该接口支持 status 筛选。不同后端实现可能只支持单个 status，因此这里按状态分多次拉取后合并。
    const statuses = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'OFFLINE']
    const tasks = statuses.map(async (s) => {
      try {
        const req = await VideosApiFp(apiConfig).apiVideosMineGet(s)
        const res = await req()
        return (res.data.data || []).map(adaptVideo)
      } catch {
        return [] as UiVideo[]
      }
    })
    const chunks = await Promise.all(tasks)
    const merged = chunks.flat()

    // 去重（防止后端忽略 status 参数导致返回重复）
    const map = new Map<number, UiVideo>()
    for (const v of merged) map.set(v.id, v)
    videos.value = Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
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

const handleEdit = (id: number) => {
  // 跳转到上传页并带上草稿 id，让上传页回填并支持继续修改/再次提交
  router.push({ path: '/volunteer/videos/upload', query: { id: String(id) } })
}

const handleDelete = async (_id: number) => {
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


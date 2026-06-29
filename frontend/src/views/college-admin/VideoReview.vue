<template>
  <div class="review-page">
    <div class="page-header">
      <h2>视频审核</h2>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="待审核" value="REVIEW" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
            </el-select>
          </el-form-item>
          <el-form-item label="志愿者">
            <el-input v-model="filters.volunteer" placeholder="搜索志愿者" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="filters.grade" placeholder="全部" clearable style="width: 150px">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
          </el-form-item>
          <el-form-item label="学科">
            <el-select v-model="filters.subject" placeholder="全部" clearable style="width: 150px">
              <el-option label="数学" value="数学" />
              <el-option label="语文" value="语文" />
              <el-option label="英语" value="英语" />
              <el-option label="科学" value="科学" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div style="margin-bottom: 15px">
        <el-button
          type="success"
          :disabled="selectedVideos.length === 0"
          @click="handleBatchApprove"
        >
          批量通过
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedVideos.length === 0"
          @click="handleBatchReject"
        >
          批量驳回
        </el-button>
        <span style="margin-left: 10px; color: #666">
          已选择 {{ selectedVideos.length }} 项
        </span>
      </div>
      
      <el-table
        :data="filteredVideos"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="title" label="标题" width="250" />
        <el-table-column prop="volunteerName" label="志愿者" width="120" />
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
            <div v-if="row.reviewerName && row.reviewTime" style="font-size: 12px; color: #999; margin-top: 4px">
              已由 {{ row.reviewerName }} 审核
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="String(row.status || '').toUpperCase() === 'REVIEW' && !row.reviewerName"
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="String(row.status || '').toUpperCase() === 'REVIEW' && !row.reviewerName"
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button
              v-if="String(row.status || '').toUpperCase() === 'REVIEW' && row.reviewerName"
              type="info"
              size="small"
              disabled
            >
              已被审核
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
    
    <!-- 驳回对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      :title="selectedVideos.length > 0 ? '批量驳回理由' : '驳回理由'"
      width="500px"
    >
      <el-form :model="rejectForm">
        <el-form-item label="驳回理由">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回理由（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="previewDialogVisible" :video="currentPreviewVideo" :isMine="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewApi } from '@/utils/api'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import type { Video as ApiVideo, VideoStatusEnum } from '@/api-services/models'
import { apiConfig } from '@/apiClient'
import VideoPreviewDialog from '@/components/VideoPreviewDialog.vue'

type UiVideo = {
  id: number
  title: string
  description: string
  videoUrl: string
  coverUrl?: string | null
  grade: string[]
  subject: string
  status: VideoStatusEnum | string
  volunteerName: string
  collegeName?: string
  playCount: number
  likeCount: number
  collectCount: number
  createdAt: string
  reviewTime?: string
  reviewerName?: string
  reviewReason?: string
}

const videos = ref<UiVideo[]>([])
const selectedVideos = ref<UiVideo[]>([])
const filters = reactive({
  status: '',
  volunteer: '',
  grade: '',
  subject: ''
})

const rejectDialogVisible = ref(false)
const currentRejectVideo = ref<UiVideo | null>(null)
const rejectMode = ref<'single' | 'batch'>('single')
const rejectForm = reactive({
  reason: ''
})

const filteredVideos = computed(() => {
  let result = videos.value
  
  if (filters.status) {
    result = result.filter(v => String(v.status || '').toUpperCase() === String(filters.status).toUpperCase())
  }
  
  if (filters.volunteer) {
    result = result.filter(v => 
      v.volunteerName.includes(filters.volunteer)
    )
  }
  
  if (filters.grade) {
    result = result.filter(v => v.grade.includes(filters.grade))
  }
  
  if (filters.subject) {
    result = result.filter(v => v.subject === filters.subject)
  }
  
  return result
})

const checkSelectable = (row: UiVideo) => {
  // 只能选择待审核且未被其他管理员审核的视频
  return String(row.status || '').toUpperCase() === 'REVIEW' && !row.reviewerName
}

const handleSelectionChange = (selection: UiVideo[]) => {
  selectedVideos.value = selection
}

onMounted(async () => {
  await loadVideos()
})

const loadVideos = async () => {
  try {
    // 后端新版本使用大写枚举：REVIEW/APPROVED/REJECTED...
    // 审核页默认只看待审核（REVIEW），并支持切换到 APPROVED/REJECTED
    const status = filters.status ? String(filters.status).toUpperCase() : 'REVIEW'
    // 管理端列表：必须使用 /api/videos/admin（需要 token），否则会拿到游客/公开列表或直接 401
    const req = await VideosApiFp(apiConfig).apiVideosAdminGet(
      status as any,
      undefined, // collegeId: 学院管理员后端会自动限定本学院；平台管理员才需要跨学院筛选
      undefined, // uploaderId
      filters.volunteer || undefined, // search
      filters.grade || undefined,
      filters.subject || undefined,
      undefined, // sort
      undefined, // page
      undefined // pageSize
    )
    const res = await req()
    const data: any = (res as any)?.data?.data
    // 兼容多种后端返回结构：
    // - 直接数组：data = []
    // - 分页对象：data = { list: [], total: ... } / { records: [] } / { items: [] }
    const listRaw = Array.isArray(data)
      ? data
      : (data?.list ?? data?.records ?? data?.items ?? [])
    const list: ApiVideo[] = (Array.isArray(listRaw) ? listRaw : []) as any

    if (!Array.isArray(listRaw)) {
      // 不要阻塞 UI，但给开发排查线索
      console.warn('[VideoReview] /api/videos/admin 返回 data 不是数组，已降级为空数组：', data)
    }

    videos.value = list.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.intro || '',
      videoUrl: v.url,
      coverUrl: v.coverUrl,
      grade: v.gradeRange ? String(v.gradeRange).split(',').map((i: string) => i.trim()).filter(Boolean) : [],
      subject: v.subjectTag || '',
      status: v.status,
      volunteerName: v.uploaderName || v.volunteerName || '',
      collegeName: v.collegeName || '',
      playCount: v.metrics?.playCount ?? 0,
      likeCount: v.metrics?.likeCount ?? 0,
      collectCount: v.metrics?.favCount ?? 0,
      createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
      reviewTime: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : undefined,
      reviewerName: v.reviewerName || '',
      reviewReason: v.rejectReason || ''
    }))
  } catch (error: any) {
    ElMessage.error(error.message || '加载视频列表失败')
  }
}

const getStatusType = (status: string) => {
  const s = String(status || '').toUpperCase()
  const map: Record<string, string> = {
    REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[s] || 'info'
}

const getStatusText = (status: string) => {
  const s = String(status || '').toUpperCase()
  const map: Record<string, string> = {
    DRAFT: '草稿',
    REVIEW: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    PUBLISHED: '已上架',
    OFFLINE: '已下架'
  }
  return map[s] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 本页后端目前只支持按 status 拉取；其它筛选在前端 computed 里做
  loadVideos()
}

const handleReset = () => {
  filters.status = ''
  filters.volunteer = ''
  filters.grade = ''
  filters.subject = ''
  loadVideos()
}

const handleBatchApprove = async () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请选择要审核的视频')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要通过选中的 ${selectedVideos.value.length} 个视频吗？`,
      '批量审核',
      { type: 'warning' }
    )
    
    // TODO: 调用批量审核API
    for (const video of selectedVideos.value) {
      await reviewApi.reviewVideo(video.id, 'approve')
    }
    
    ElMessage.success('批量审核通过成功')
    selectedVideos.value = []
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量审核失败')
    }
  }
}

const handleBatchReject = () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请选择要审核的视频')
    return
  }
  rejectMode.value = 'batch'
  rejectDialogVisible.value = true
  // 批量驳回时，reason会在confirmReject中应用到所有选中项
}

const confirmBatchReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }
  
  try {
    // TODO: 调用批量驳回API
    for (const video of selectedVideos.value) {
      await reviewApi.reviewVideo(video.id, 'reject', rejectForm.reason)
    }
    
    ElMessage.success('批量驳回成功')
    rejectDialogVisible.value = false
    selectedVideos.value = []
    await loadVideos()
  } catch (error: any) {
    ElMessage.error(error.message || '批量驳回失败')
  }
}

const handleApprove = async (video: UiVideo) => {
  try {
    await ElMessageBox.confirm('确定要通过这个视频吗？', '提示', {
      type: 'warning'
    })
    await reviewApi.reviewVideo(video.id, 'approve')
    ElMessage.success('审核通过')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核失败')
    }
  }
}

const handleReject = (video: UiVideo) => {
  currentRejectVideo.value = video
  rejectMode.value = 'single'
  selectedVideos.value = [] // 清空批量选择
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }

  // 批量驳回
  if (rejectMode.value === 'batch') {
    await confirmBatchReject()
    return
  }
  
  // 单个驳回
  if (!currentRejectVideo.value) return
  
  try {
    await reviewApi.reviewVideo(currentRejectVideo.value.id, 'reject', rejectForm.reason)
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    currentRejectVideo.value = null
    rejectForm.reason = ''
    await loadVideos()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handlePreview = (video: UiVideo) => {
  // 打开预览对话框
  previewDialogVisible.value = true
  currentPreviewVideo.value = video
}

const previewDialogVisible = ref(false)
const currentPreviewVideo = ref<UiVideo | null>(null)
</script>

<style scoped lang="scss">
.review-page {
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


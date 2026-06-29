<template>
  <div class="videos-page">
    <div class="page-header">
      <h2>全局视频管理</h2>
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
              <el-option label="待审核" value="REVIEW" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
              <el-option label="已上架" value="PUBLISHED" />
              <el-option label="已下架" value="OFFLINE" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="标题/志愿者" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredVideos" style="width: 100%">
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="collegeName" label="学院" width="150" />
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
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'published'"
              type="danger"
              size="small"
              @click="handleOffline(row)"
            >
              兜底下架
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
    
    <!-- 下架对话框 -->
    <el-dialog
      v-model="offlineDialogVisible"
      title="兜底下架"
      width="500px"
    >
      <el-form :model="offlineForm">
        <el-form-item label="下架理由">
          <el-input
            v-model="offlineForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入下架理由（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="offlineDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmOffline">确认下架</el-button>
      </template>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="previewDialogVisible" :video="currentPreviewVideo" :isMine="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { videoApi, collegeApi } from '@/utils/api'
import type { Video, College } from '@/utils/mockData'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import type { Video as ApiVideo } from '@/api-services/models'
import { apiConfig } from '@/apiClient'
import VideoPreviewDialog from '@/components/VideoPreviewDialog.vue'

const videos = ref<Video[]>([])
const colleges = ref<College[]>([])
const filters = reactive({
  collegeId: null as number | null,
  status: '',
  keyword: ''
})

const offlineDialogVisible = ref(false)
const currentOfflineVideo = ref<Video | null>(null)
const offlineForm = reactive({
  reason: ''
})

const filteredVideos = computed(() => videos.value)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    // 管理端视频列表必须使用 /api/videos/admin（可跨学院筛选）
    const status = filters.status ? String(filters.status).toUpperCase() : undefined
    const req = await VideosApiFp(apiConfig).apiVideosAdminGet(
      status,
      filters.collegeId ?? undefined,
      undefined,
      filters.keyword || undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    )
    const res = await req()
    const data: any = (res as any)?.data?.data
    const listRaw = Array.isArray(data) ? data : (data?.list ?? data?.records ?? data?.items ?? [])
    const list: ApiVideo[] = (Array.isArray(listRaw) ? listRaw : []) as any
    videos.value = list.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.intro || '',
      coverUrl: v.coverUrl || '',
      videoUrl: v.url,
      duration: v.duration || 0,
      grade: v.gradeRange ? String(v.gradeRange).split(',').map((i: string) => i.trim()).filter(Boolean) : [],
      subject: v.subjectTag || '',
      tags: [],
      status: (String(v.status || '').toLowerCase() as any),
      volunteerId: v.uploaderId,
      volunteerName: v.uploaderName || (v.uploader as any)?.name || '',
      collegeId: v.collegeId,
      collegeName: v.collegeName || (v.college as any)?.name || '',
      playCount: v.metrics?.playCount ?? 0,
      likeCount: v.metrics?.likeCount ?? 0,
      collectCount: v.metrics?.favCount ?? 0,
      createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : (v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString()),
      reviewReason: v.rejectReason || undefined,
      reviewTime: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : undefined,
      reviewerName: v.reviewerName || ''
    } as any))
    colleges.value = await collegeApi.getColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  }
}

const getStatusType = (status: string) => {
  const s = String(status || '').toLowerCase()
  const map: Record<string, string> = {
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    published: 'success',
    offline: 'info'
  }
  return map[s] || 'info'
}

const getStatusText = (status: string) => {
  const s = String(status || '').toLowerCase()
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    published: '已上架',
    offline: '已下架'
  }
  return map[s] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  filters.collegeId = null
  filters.status = ''
  filters.keyword = ''
  loadData()
}

const handleOffline = (video: Video) => {
  currentOfflineVideo.value = video
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmOffline = async () => {
  if (!offlineForm.reason.trim()) {
    ElMessage.warning('请输入下架理由')
    return
  }
  
  if (!currentOfflineVideo.value) return
  
  try {
    // 平台端兜底下架：当前后端下架接口不接收 reason（OpenAPI 为 /videos/{id}/offline）
    // 这里先调用真实下架接口，reason 仅作为本地审计提示（如后端后续增加 reason 参数再对齐）
    console.info('[platform-admin/Videos] offline reason:', offlineForm.reason)
    await videoApi.togglePublish(currentOfflineVideo.value.id, 'offline')
    ElMessage.success('已下架')
    offlineDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handlePreview = (video: Video) => {
  previewDialogVisible.value = true
  currentPreviewVideo.value = video
}

const previewDialogVisible = ref(false)
const currentPreviewVideo = ref<Video | null>(null)
</script>

<style scoped lang="scss">
.videos-page {
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


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
              <el-option label="草稿" value="draft" />
              <el-option label="审核中" value="reviewing" />
              <el-option label="审核通过" value="approved" />
              <el-option label="审核驳回" value="rejected" />
              <el-option label="已上架" value="published" />
              <el-option label="已下架" value="offline" />
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
    <VideoPreviewDialog v-model="previewDialogVisible" :video="currentPreviewVideo" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { videoApi, collegeApi } from '@/utils/api'
import type { Video, College } from '@/utils/mockData'
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

const filteredVideos = computed(() => {
  let result = videos.value
  
  if (filters.collegeId) {
    result = result.filter(v => v.collegeId === filters.collegeId)
  }
  
  if (filters.status) {
    result = result.filter(v => v.status === filters.status)
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(v => 
      v.title.toLowerCase().includes(keyword) ||
      v.volunteerName.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    videos.value = await videoApi.getVideos()
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

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  filters.collegeId = null
  filters.status = ''
  filters.keyword = ''
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


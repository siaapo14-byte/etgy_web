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
              <el-option label="待审核" value="reviewing" />
              <el-option label="已通过" value="approved" />
              <el-option label="已驳回" value="rejected" />
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
              v-if="row.status === 'reviewing' && !row.reviewerName"
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'reviewing' && !row.reviewerName"
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button
              v-if="row.status === 'reviewing' && row.reviewerName"
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
              <el-descriptions-item label="提交时间">
                {{ formatDate(currentPreviewVideo.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentPreviewVideo.reviewTime" label="审核时间">
                {{ formatDate(currentPreviewVideo.reviewTime) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentPreviewVideo.reviewerName" label="审核人">
                {{ currentPreviewVideo.reviewerName }}
              </el-descriptions-item>
              <el-descriptions-item v-if="currentPreviewVideo.reviewReason" label="审核意见">
                <div style="color: #f56c6c">{{ currentPreviewVideo.reviewReason }}</div>
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
import { videoApi, reviewApi } from '@/utils/api'
import type { Video } from '@/utils/mockData'

const videos = ref<Video[]>([])
const selectedVideos = ref<Video[]>([])
const filters = reactive({
  status: '',
  volunteer: '',
  grade: '',
  subject: ''
})

const rejectDialogVisible = ref(false)
const currentRejectVideo = ref<Video | null>(null)
const rejectForm = reactive({
  reason: ''
})

const filteredVideos = computed(() => {
  let result = videos.value
  
  if (filters.status) {
    result = result.filter(v => v.status === filters.status)
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

const checkSelectable = (row: Video) => {
  // 只能选择待审核且未被其他管理员审核的视频
  return row.status === 'reviewing' && !row.reviewerName
}

const handleSelectionChange = (selection: Video[]) => {
  selectedVideos.value = selection
}

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
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger'
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
  filters.grade = ''
  filters.subject = ''
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

const handleApprove = async (video: Video) => {
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

const handleReject = (video: Video) => {
  currentRejectVideo.value = video
  selectedVideos.value = [] // 清空批量选择
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }
  
  // 如果是批量驳回
  if (selectedVideos.value.length > 0) {
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

const handlePreview = (video: Video) => {
  // 打开预览对话框
  previewDialogVisible.value = true
  currentPreviewVideo.value = video
}

const previewDialogVisible = ref(false)
const currentPreviewVideo = ref<Video | null>(null)
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


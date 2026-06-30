<template>
  <div class="review-page">
    <div class="page-header">
      <h2>直播审核</h2>
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
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div style="margin-bottom: 15px">
        <el-button
          type="success"
          :disabled="selectedLives.length === 0"
          @click="handleBatchApprove"
        >
          批量通过
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedLives.length === 0"
          @click="handleBatchReject"
        >
          批量驳回
        </el-button>
        <span style="margin-left: 10px; color: #666">
          已选择 {{ selectedLives.length }} 项
        </span>
      </div>
      
      <el-table
        :data="filteredLives"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="title" label="主题" width="250" />
        <el-table-column prop="volunteerName" label="志愿者" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长（分钟）" width="120">
          <template #default="{ row }">
            {{ Math.floor(row.duration / 60) }}
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="学科" width="100" />
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
        <el-table-column prop="createdAt" label="申请时间" width="180">
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
              @click="handleView(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 驳回对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      :title="selectedLives.length > 0 ? '批量驳回理由' : '驳回理由'"
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
    
    <!-- 直播详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="直播申请详情"
      width="700px"
    >
      <div v-if="currentDetailLive" class="live-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="主题" :span="2">
            {{ currentDetailLive.title }}
          </el-descriptions-item>
          <el-descriptions-item label="简介" :span="2">
            {{ currentDetailLive.description }}
          </el-descriptions-item>
          <el-descriptions-item label="志愿者">
            {{ currentDetailLive.volunteerName }}
          </el-descriptions-item>
          <el-descriptions-item label="所属学院">
            {{ currentDetailLive.collegeName }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDate(currentDetailLive.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="时长">
            {{ Math.floor(currentDetailLive.duration / 60) }} 分钟
          </el-descriptions-item>
          <el-descriptions-item label="适用年级" :span="2">
            <el-tag v-for="g in currentDetailLive.grade" :key="g" size="small" style="margin-right: 5px">
              {{ g }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="学科">
            {{ currentDetailLive.subject }}
          </el-descriptions-item>
          <el-descriptions-item label="预估人数">
            {{ currentDetailLive.estimatedViewers }} 人
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentDetailLive.status)">
              {{ getStatusText(currentDetailLive.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(currentDetailLive.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetailLive.reviewTime" label="审核时间">
            {{ formatDate(currentDetailLive.reviewTime) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetailLive.reviewerName" label="审核人">
            {{ currentDetailLive.reviewerName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetailLive.reviewReason" label="审核意见" :span="2">
            <div style="color: #f56c6c">{{ currentDetailLive.reviewReason }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetailLive.status === 'live' || currentDetailLive.status === 'ended'" label="峰值观看">
            {{ currentDetailLive.peakViewers }} 人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetailLive.status === 'live' || currentDetailLive.status === 'ended'" label="平均在线">
            {{ currentDetailLive.averageViewers }} 人
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { liveApi, reviewApi } from '@/utils/api'
import type { Live } from '@/utils/mockData'

const lives = ref<Live[]>([])
const selectedLives = ref<Live[]>([])
const filters = reactive({
  status: '',
  volunteer: ''
})

const rejectDialogVisible = ref(false)
const currentRejectLive = ref<Live | null>(null)
const rejectForm = reactive({
  reason: ''
})

const filteredLives = computed(() => {
  let result = lives.value
  
  if (filters.status) {
    result = result.filter(l => l.status === filters.status)
  }
  
  if (filters.volunteer) {
    result = result.filter(l => 
      l.volunteerName.includes(filters.volunteer)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadLives()
})

const loadLives = async () => {
  try {
    lives.value = await liveApi.getAdminLives({
      status: filters.status || undefined,
      search: filters.volunteer || undefined,
    })
  } catch (error: any) {
    ElMessage.error(error.message || '加载直播列表失败')
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
  void loadLives()
}

const handleReset = () => {
  filters.status = ''
  filters.volunteer = ''
  void loadLives()
}

const checkSelectable = (row: Live) => {
  // 只能选择待审核且未被其他管理员审核的直播
  return row.status === 'reviewing' && !row.reviewerName
}

const handleSelectionChange = (selection: Live[]) => {
  selectedLives.value = selection
}

const handleBatchApprove = async () => {
  if (selectedLives.value.length === 0) {
    ElMessage.warning('请选择要审核的直播')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要通过选中的 ${selectedLives.value.length} 个直播申请吗？`,
      '批量审核',
      { type: 'warning' }
    )
    
    // TODO: 调用批量审核API
    for (const live of selectedLives.value) {
      await reviewApi.reviewLive(live.id, 'approve')
    }
    
    ElMessage.success('批量审核通过成功')
    selectedLives.value = []
    await loadLives()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量审核失败')
    }
  }
}

const handleBatchReject = () => {
  if (selectedLives.value.length === 0) {
    ElMessage.warning('请选择要审核的直播')
    return
  }
  
  rejectDialogVisible.value = true
}

const handleApprove = async (live: Live) => {
  try {
    await ElMessageBox.confirm('确定要通过这个直播申请吗？', '提示', {
      type: 'warning'
    })
    await reviewApi.reviewLive(live.id, 'approve')
    ElMessage.success('审核通过')
    await loadLives()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核失败')
    }
  }
}

const handleReject = (live: Live) => {
  currentRejectLive.value = live
  selectedLives.value = [] // 清空批量选择
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }
  
  // 如果是批量驳回
  if (selectedLives.value.length > 0) {
    try {
      for (const live of selectedLives.value) {
        await reviewApi.reviewLive(live.id, 'reject', rejectForm.reason)
      }
      ElMessage.success('批量驳回成功')
      rejectDialogVisible.value = false
      selectedLives.value = []
      rejectForm.reason = ''
      await loadLives()
    } catch (error: any) {
      ElMessage.error(error.message || '批量驳回失败')
    }
    return
  }
  
  // 单个驳回
  if (!currentRejectLive.value) return
  
  try {
    await reviewApi.reviewLive(currentRejectLive.value.id, 'reject', rejectForm.reason)
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    currentRejectLive.value = null
    rejectForm.reason = ''
    await loadLives()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleView = (live: Live) => {
  detailDialogVisible.value = true
  currentDetailLive.value = live
}

const detailDialogVisible = ref(false)
const currentDetailLive = ref<Live | null>(null)
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


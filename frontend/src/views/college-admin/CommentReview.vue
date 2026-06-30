<template>
  <div class="comment-review-page">
    <div class="page-header">
      <h2>评论审核</h2>
      <p class="subtitle">
        第三层人工审核：自动过滤（敏感词 + NLP）后的高风险评论在此进行人工复核
      </p>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="待审核" style="width: 150px" @change="loadData">
              <el-option label="待审核" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索评论内容"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="filters.status === 'PENDING'" style="margin-bottom: 15px">
        <el-button type="success" :disabled="selected.length === 0" @click="handleBatchApprove">
          批量通过
        </el-button>
        <el-button type="danger" :disabled="selected.length === 0" @click="handleBatchReject">
          批量驳回
        </el-button>
        <span style="margin-left: 10px; color: #666">已选择 {{ selected.length }} 项</span>
      </div>

      <el-table
        v-loading="loading"
        :data="comments"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="filters.status === 'PENDING'"
          type="selection"
          width="45"
        />
        <el-table-column prop="content" label="评论内容" min-width="280">
          <template #default="{ row }">
            <div class="comment-content">{{ row.content }}</div>
            <div v-if="row.status === 'REJECTED' && row.rejectReason" class="reject-reason">
              驳回理由：{{ row.rejectReason }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="发布者" width="120" />
        <el-table-column prop="videoTitle" label="所属视频" width="180">
          <template #default="{ row }">
            <div>{{ row.videoTitle || `视频#${row.videoId}` }}</div>
            <div v-if="row.videoCollegeName" class="video-college">{{ row.videoCollegeName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" size="small" @click="handleReject(row)">驳回</el-button>
            </template>
            <el-button v-else type="info" size="small" disabled>已处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 驳回理由对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      :title="rejectMode === 'batch' ? '批量驳回理由' : '驳回理由'"
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
        <el-button type="danger" :loading="submitting" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commentApi } from '@/utils/api'

type UiComment = {
  id: number
  videoId: number
  videoTitle: string
  videoCollegeName: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  authorId: number
  authorName: string
  rejectReason: string
  createdAt: string
}

const comments = ref<UiComment[]>([])
const selected = ref<UiComment[]>([])
const loading = ref(false)
const submitting = ref(false)

const filters = reactive({
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
  keyword: ''
})

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const rejectDialogVisible = ref(false)
const rejectMode = ref<'single' | 'batch'>('single')
const currentRejectComment = ref<UiComment | null>(null)
const rejectForm = reactive({ reason: '' })

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await commentApi.getComments({
      status: filters.status,
      q: filters.keyword || undefined,
      page: page.value,
      pageSize: pageSize.value
    })
    comments.value = res.items as UiComment[]
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载评论失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handleReset = () => {
  filters.status = 'PENDING'
  filters.keyword = ''
  page.value = 1
  loadData()
}

const handleSelectionChange = (rows: UiComment[]) => {
  selected.value = rows
}

const handleApprove = async (comment: UiComment) => {
  try {
    await ElMessageBox.confirm('确定通过这条评论吗？', '提示', { type: 'warning' })
    await commentApi.auditComment(comment.id, 'approve')
    ElMessage.success('已通过')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  }
}

const handleReject = (comment: UiComment) => {
  rejectMode.value = 'single'
  currentRejectComment.value = comment
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const handleBatchApprove = async () => {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定通过选中的 ${selected.value.length} 条评论吗？`, '批量审核', {
      type: 'warning'
    })
    await commentApi.auditCommentsBatch(selected.value.map((c) => c.id), 'approve')
    ElMessage.success('批量通过成功')
    selected.value = []
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '批量审核失败')
  }
}

const handleBatchReject = () => {
  if (selected.value.length === 0) return
  rejectMode.value = 'batch'
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }
  submitting.value = true
  try {
    if (rejectMode.value === 'batch') {
      await commentApi.auditCommentsBatch(selected.value.map((c) => c.id), 'reject', rejectForm.reason)
      ElMessage.success('批量驳回成功')
      selected.value = []
    } else if (currentRejectComment.value) {
      await commentApi.auditComment(currentRejectComment.value.id, 'reject', rejectForm.reason)
      ElMessage.success('已驳回')
    }
    rejectDialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : ''
}
</script>

<style scoped lang="scss">
.comment-review-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
    }

    .subtitle {
      margin: 6px 0 0;
      font-size: 13px;
      color: #909399;
    }
  }

  .filter-bar {
    margin-bottom: 16px;
  }

  .comment-content {
    line-height: 1.6;
    word-break: break-all;
  }

  .reject-reason {
    margin-top: 4px;
    font-size: 12px;
    color: #f56c6c;
  }

  .video-college {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }

  .pagination-bar {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

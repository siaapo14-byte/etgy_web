<template>
  <div class="alerts-page">
    <div class="page-header">
      <h2>风险告警</h2>
    </div>
    
    <el-card>
      <el-table :data="alerts" style="width: 100%">
        <el-table-column prop="type" label="告警类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="250" />
        <el-table-column prop="collegeName" label="所属学院" width="150" />
        <el-table-column prop="severity" label="严重程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getSeverityColor(row.severity)">
              {{ getSeverityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'pending' ? 'warning' : 'success'">
              {{ row.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="告警时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleView(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 告警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="风险告警详情"
      width="700px"
    >
      <div v-if="currentDetailAlert" class="alert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警类型" :span="2">
            <el-tag :type="getTypeColor(currentDetailAlert.type)">
              {{ getTypeText(currentDetailAlert.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">
            {{ currentDetailAlert.title }}
          </el-descriptions-item>
          <el-descriptions-item label="所属学院">
            {{ currentDetailAlert.collegeName }}
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityColor(currentDetailAlert.severity)">
              {{ getSeverityText(currentDetailAlert.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetailAlert.status === 'pending' ? 'warning' : 'success'">
              {{ currentDetailAlert.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警时间">
            {{ formatDate(currentDetailAlert.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="详情描述" :span="2">
            <div style="padding: 10px; background: #f5f7fa; border-radius: 4px; white-space: pre-wrap;">
              {{ currentDetailAlert.details }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentDetailAlert && currentDetailAlert.status === 'pending'"
          type="primary"
          @click="handleProcessFromDetail"
        >
          处理告警
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Alert {
  id: number
  type: 'ai_risk' | 'content_violation' | 'user_abuse'
  title: string
  collegeName: string
  severity: 'low' | 'medium' | 'high'
  status: 'pending' | 'processed'
  createdAt: string
  details: string
}

const alerts = ref<Alert[]>([
  {
    id: 1,
    type: 'ai_risk',
    title: 'AI会话高风险检测',
    collegeName: '数学学院',
    severity: 'high',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    details: '检测到儿童用户输入高风险内容'
  }
])

onMounted(async () => {
  await loadAlerts()
})

const loadAlerts = async () => {
  // TODO: 从API加载告警数据
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    ai_risk: 'danger',
    content_violation: 'warning',
    user_abuse: 'danger'
  }
  return map[type] || 'info'
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    ai_risk: 'AI风险',
    content_violation: '内容违规',
    user_abuse: '用户滥用'
  }
  return map[type] || type
}

const getSeverityColor = (severity: string) => {
  const map: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return map[severity] || 'info'
}

const getSeverityText = (severity: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return map[severity] || severity
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleProcess = (alert: Alert) => {
  ElMessage.info('处理告警功能开发中')
}

const handleProcessFromDetail = () => {
  if (currentDetailAlert.value) {
    handleProcess(currentDetailAlert.value)
  }
}

const handleView = (alert: Alert) => {
  detailDialogVisible.value = true
  currentDetailAlert.value = alert
}

const detailDialogVisible = ref(false)
const currentDetailAlert = ref<Alert | null>(null)
</script>

<style scoped lang="scss">
.alerts-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
}
</style>


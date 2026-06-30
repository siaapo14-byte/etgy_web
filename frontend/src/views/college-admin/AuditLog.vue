<template>
  <div class="audit-page">
    <div class="page-header">
      <h2>审计日志</h2>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="资源类型">
            <el-select v-model="filters.targetType" placeholder="全部" clearable style="width: 150px">
              <el-option label="视频" value="Video" />
              <el-option label="直播" value="Live" />
              <el-option label="评论" value="VideoComment" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filters.operatorName" placeholder="搜索操作人" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="userName" label="操作人" width="120" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="resourceType" label="资源类型" width="100">
          <template #default="{ row }">
            {{ formatResourceType(row.resourceType) }}
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadLogs"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { auditApi } from '@/utils/api'
type UiAuditLog = {
  id: number
  userId: number
  userName: string
  role: string
  action: string
  resourceType: string
  resourceId: number
  details: string
  ip: string
  createdAt: string
}

const logs = ref<UiAuditLog[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  targetType: '' as '' | 'Video' | 'Live' | 'VideoComment',
  operatorName: ''
})

const resourceTypeLabels: Record<string, string> = {
  Video: '视频',
  Live: '直播',
  VideoComment: '评论'
}

onMounted(async () => {
  await loadLogs()
})

const loadLogs = async () => {
  try {
    loading.value = true
    const res = await auditApi.getAuditLogs({
      targetType: filters.targetType || undefined,
      operatorName: filters.operatorName.trim() || undefined,
      page: page.value,
      pageSize: pageSize.value
    })
    logs.value = res.items
    total.value = res.total
  } catch (error: any) {
    console.error('加载审计日志失败', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatResourceType = (type: string) => {
  return resourceTypeLabels[type] ?? type
}

const handleSearch = () => {
  page.value = 1
  loadLogs()
}

const handleReset = () => {
  filters.targetType = ''
  filters.operatorName = ''
  page.value = 1
  loadLogs()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  page.value = 1
  loadLogs()
}
</script>

<style scoped lang="scss">
.audit-page {
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

  .pager {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>


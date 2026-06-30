<template>
  <div class="audit-page">
    <div class="page-header">
      <h2>全局审计日志</h2>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="操作类型">
            <el-select v-model="filters.action" placeholder="全部" clearable style="width: 150px">
              <el-option label="审核通过" value="审核通过" />
              <el-option label="审核驳回" value="审核驳回" />
              <el-option label="上架" value="上架" />
              <el-option label="下架" value="下架" />
            </el-select>
          </el-form-item>
          <el-form-item label="资源类型">
            <el-select v-model="filters.resourceType" placeholder="全部" clearable style="width: 150px">
              <el-option label="视频" value="Video" />
              <el-option label="直播" value="Live" />
              <el-option label="评论" value="VideoComment" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filters.userName" placeholder="搜索操作人" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredLogs" style="width: 100%">
        <el-table-column prop="userName" label="操作人" width="120" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="resourceType" label="资源类型" width="100" />
        <el-table-column prop="details" label="详情" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { auditApi } from '@/utils/api'
import type { AuditLog } from '@/utils/mockData'

const logs = ref<AuditLog[]>([])
const filters = reactive({
  action: '',
  resourceType: '',
  userName: ''
})

const filteredLogs = computed(() => {
  let result = logs.value
  
  if (filters.action) {
    result = result.filter(l => l.action === filters.action)
  }
  
  if (filters.resourceType) {
    result = result.filter(l => l.resourceType === filters.resourceType)
  }
  
  if (filters.userName) {
    result = result.filter(l => l.userName.includes(filters.userName))
  }
  
  return result
})

onMounted(async () => {
  await loadLogs()
})

const loadLogs = async () => {
  try {
    const res = await auditApi.getAuditLogs({
      operatorName: filters.userName.trim() || undefined
    })
    logs.value = res.items
  } catch (error: any) {
    console.error('加载审计日志失败', error)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  filters.action = ''
  filters.resourceType = ''
  filters.userName = ''
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
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
}
</style>


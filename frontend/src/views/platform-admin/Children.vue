<template>
  <div class="children-page">
    <div class="page-header">
      <h2>儿童账号建档</h2>
      <el-button type="primary" @click="showImportDialog = true">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
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
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="姓名/账号" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredChildren" style="width: 100%">
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="school" label="学校" width="200" />
        <el-table-column prop="collegeName" label="所属学院" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入儿童账号"
      width="600px"
    >
      <el-form :model="importForm" label-width="120px">
        <el-form-item label="所属学院">
          <el-select v-model="importForm.collegeId" placeholder="请选择学院" style="width: 100%">
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="导入模板">
          <div style="margin-bottom: 15px">
            <el-button type="success" @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载导入模板
            </el-button>
            <span style="margin-left: 10px; color: #666; font-size: 12px">
              请先下载模板，填写后再上传
            </span>
          </div>
          <el-alert
            type="info"
            :closable="false"
            style="margin-bottom: 15px"
          >
            <template #title>
              <div style="font-size: 12px; line-height: 1.6">
                <p><strong>填写说明：</strong></p>
                <p>1. 模板中包含示例行和填写说明（以#开头），导入时会被自动忽略</p>
                <p>2. 性别请填写：男 或 女</p>
                <p>3. 年级请填写：一年级、二年级、三年级、四年级、五年级、六年级</p>
                <p>4. 请勿修改表头，删除示例行后填写实际数据</p>
                <p>5. 每行代表一个儿童账号</p>
              </div>
            </template>
          </el-alert>
        </el-form-item>
        <el-form-item label="Excel文件">
          <el-upload
            :auto-upload="false"
            accept=".csv"
            :limit="1"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持格式：.csv（Excel文件请另存为CSV格式）
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { childApi, collegeApi } from '@/utils/api'
import type { Child, College } from '@/utils/mockData'

const children = ref<Child[]>([])
const colleges = ref<College[]>([])
const filters = reactive({
  collegeId: null as number | null,
  grade: '',
  keyword: ''
})

const showImportDialog = ref(false)
const importForm = reactive({
  collegeId: null as number | null,
  file: null as File | null
})

const filteredChildren = computed(() => {
  let result = children.value
  
  if (filters.collegeId) {
    result = result.filter(c => c.collegeId === filters.collegeId)
  }
  
  if (filters.grade) {
    result = result.filter(c => c.grade === filters.grade)
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(c => 
      c.name.toLowerCase().includes(keyword) ||
      c.username.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    children.value = await childApi.getChildren()
    colleges.value = await collegeApi.getColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  filters.collegeId = null
  filters.grade = ''
  filters.keyword = ''
}

const handleFileChange = (file: any) => {
  importForm.file = file.raw
}

const downloadTemplate = async () => {
  try {
    await childApi.downloadChildrenTemplate()
    ElMessage.success('模板下载成功，请填写后上传')
  } catch (error: any) {
    ElMessage.error(error.message || '模板下载失败')
  }
}

const handleImport = async () => {
  if (!importForm.collegeId) {
    ElMessage.warning('请选择所属学院')
    return
  }
  
  if (!importForm.file) {
    ElMessage.warning('请选择Excel文件')
    return
  }
  
  try {
    const { parseExcel, validateChildrenData } = await import('@/utils/excelParser')
    const rows = await parseExcel(importForm.file)
    const validation = validateChildrenData(rows)
    
    if (!validation.valid) {
      ElMessage.error(`数据验证失败：\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...' : ''}`)
      return
    }
    
    // 先做客户端的基础验证（格式/必填）后，调用后端 Excel 上传接口完成导入
    try {
      const resp: any = await childApi.importChildren(importForm.file!)
      // 后端返回的具体结构视接口而定，这里尽量兼容：
      // - { successCount: number, failedCount: number, errors: [...] }
      const successCount = resp?.successCount ?? resp?.created ?? (validation.data.length)
      ElMessage.success(`已提交导入请求，成功导入 ${successCount} 条（可能包含异步校验）。`)
      showImportDialog.value = false
      importForm.file = null
      importForm.collegeId = null
      // 刷新列表
      await loadData()
    } catch (err: any) {
      ElMessage.error(err.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  }
}
</script>

<style scoped lang="scss">
.children-page {
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
  
  .filter-bar {
    margin-bottom: 20px;
  }
}
</style>


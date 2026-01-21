<template>
  <div class="volunteers-page">
    <div class="page-header">
      <h2>志愿者管理</h2>
      <el-button type="primary" @click="showImportDialog = true">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
      <el-button type="success" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加志愿者
      </el-button>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="在校" value="active" />
              <el-option label="已毕业" value="inactive" />
              <el-option label="停用" value="frozen" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="姓名/学号" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="filteredVolunteers" style="width: 100%">
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="collegeName" label="学院" width="150" />
        <el-table-column prop="phone" label="联系方式" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'active'"
              type="warning"
              size="small"
              @click="handleFreeze(row)"
            >
              停用
            </el-button>
            <el-button
              v-if="row.status === 'frozen'"
              type="success"
              size="small"
              @click="handleActivate(row)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingVolunteer ? '编辑志愿者' : '添加志愿者'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="form.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联系方式" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入志愿者"
      width="600px"
    >
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
            <p>2. 学号：志愿者的学号，作为登录账号</p>
            <p>3. 性别：请填写 男 或 女</p>
            <p>4. 联系方式：手机号码</p>
            <p>5. 邮箱：有效的邮箱地址</p>
            <p>6. 请勿修改表头，删除示例行后填写实际数据</p>
            <p>7. 每行代表一个志愿者账号</p>
          </div>
        </template>
      </el-alert>
      <el-upload
        :auto-upload="false"
        accept=".csv"
        :limit="1"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            支持格式：.csv（Excel文件请另存为CSV格式）
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { volunteerApi } from '@/utils/api'
import { downloadVolunteerTemplate } from '@/utils/excelTemplate'
import type { Volunteer } from '@/utils/mockData'

const volunteers = ref<Volunteer[]>([])
const filters = reactive({
  status: '',
  keyword: ''
})

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingVolunteer = ref<Volunteer | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  studentId: '',
  name: '',
  gender: 'male' as 'male' | 'female',
  phone: '',
  email: ''
})

const rules: FormRules = {
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const filteredVolunteers = computed(() => {
  let result = volunteers.value
  
  if (filters.status) {
    result = result.filter(v => v.status === filters.status)
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(v => 
      v.name.toLowerCase().includes(keyword) ||
      v.studentId.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadVolunteers()
})

const loadVolunteers = async () => {
  try {
    volunteers.value = await volunteerApi.getVolunteers()
  } catch (error: any) {
    ElMessage.error(error.message || '加载志愿者列表失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    frozen: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    active: '在校',
    inactive: '已毕业',
    frozen: '停用'
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
  filters.keyword = ''
}

const handleEdit = (volunteer: Volunteer) => {
  editingVolunteer.value = volunteer
  form.studentId = volunteer.studentId
  form.name = volunteer.name
  form.gender = volunteer.gender
  form.phone = volunteer.phone
  form.email = volunteer.email
  showAddDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用API保存
        ElMessage.success(editingVolunteer.value ? '编辑成功' : '添加成功')
        showAddDialog.value = false
        resetForm()
        await loadVolunteers()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleFreeze = async (volunteer: Volunteer) => {
  try {
    // TODO: 调用API停用
    ElMessage.success('已停用')
    await loadVolunteers()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleActivate = async (volunteer: Volunteer) => {
  try {
    // TODO: 调用API启用
    ElMessage.success('已启用')
    await loadVolunteers()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const downloadTemplate = () => {
  downloadVolunteerTemplate()
  ElMessage.success('模板下载成功，请填写后上传')
}

const importFile = ref<File | null>(null)

const handleFileChange = (file: any) => {
  importFile.value = file.raw
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择Excel文件')
    return
  }
  
  try {
    const { parseExcel, validateVolunteerData } = await import('@/utils/excelParser')
    const rows = await parseExcel(importFile.value)
    const validation = validateVolunteerData(rows)
    
    if (!validation.valid) {
      ElMessage.error(`数据验证失败：\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...' : ''}`)
      return
    }
    
    // 调用后端批量/逐条创建接口
    try {
      const resp = await volunteerApi.importVolunteers(validation.data)
      ElMessage.success(`已提交导入请求，已创建 ${Array.isArray(resp) ? resp.length : 0} 条志愿者`)
      showImportDialog.value = false
      importFile.value = null
      await loadVolunteers()
    } catch (err: any) {
      ElMessage.error(err.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  }
}

const resetForm = () => {
  editingVolunteer.value = null
  form.studentId = ''
  form.name = ''
  form.gender = 'male'
  form.phone = ''
  form.email = ''
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.volunteers-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
    
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


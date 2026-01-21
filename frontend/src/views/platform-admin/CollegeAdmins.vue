<template>
  <div class="college-admins-page">
    <div class="page-header">
      <h2>学院管理员管理</h2>
      <el-button type="primary" @click="showImportDialog = true">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
      <el-button type="success" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="admins" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="username" label="账号" width="150" />
        <el-table-column prop="collegeName" label="所属学院" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '停用' }}
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
              @click="handleDisable(row)"
            >
              停用
            </el-button>
            <el-button
              v-if="row.status === 'inactive'"
              type="success"
              size="small"
              @click="handleEnable(row)"
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
      :title="editingAdmin ? '编辑管理员' : '添加管理员'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="所属学院" prop="collegeId">
          <el-select v-model="form.collegeId" placeholder="请选择学院" style="width: 100%">
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editingAdmin" label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入初始密码" />
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
      title="批量导入学院管理员"
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
            <p>2. 工号：学院管理员的唯一标识</p>
            <p>3. 初始密码：建议使用6位以上数字或字母</p>
            <p>4. 所属学院：请填写准确的学院名称</p>
            <p>5. 请勿修改表头，删除示例行后填写实际数据</p>
            <p>6. 每行代表一个学院管理员账号</p>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { collegeApi } from '@/utils/api'
import { downloadCollegeAdminTemplate } from '@/utils/excelTemplate'
import type { College } from '@/utils/mockData'
import { PlatformApiFp } from '@/api-services/apis/platform-api'
import { apiConfig } from '@/apiClient'

interface Admin {
  id: number
  name: string
  username: string
  collegeId: number
  collegeName: string
  status: 'active' | 'inactive'
  createdAt: string
}

const admins = ref<Admin[]>([])

const colleges = ref<College[]>([])
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingAdmin = ref<Admin | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  username: '',
  collegeId: null as number | null,
  password: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  collegeId: [{ required: true, message: '请选择学院', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

onMounted(async () => {
  await loadColleges()
  await loadAdmins()
})

const adaptAdmin = (a: any, collegesMap: Map<number, string>): Admin => {
  const collegeId = Number(a.collegeId ?? a.college?.id ?? 0)
  const collegeName = a.college?.name || collegesMap.get(collegeId) || ''
  const statusRaw = String(a.status ?? '').toUpperCase()
  const status: Admin['status'] = statusRaw === 'ACTIVE' ? 'active' : 'inactive'
  return {
    id: Number(a.id),
    name: a.realName ?? a.name ?? '',
    username: a.username ?? '',
    collegeId,
    collegeName,
    status,
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString()
  }
}

const loadAdmins = async () => {
  try {
    const collegesMap = new Map<number, string>(colleges.value.map(c => [c.id, c.name]))
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsGet(undefined)
    const res = await req()
    const list = res.data.data || []
    admins.value = Array.isArray(list) ? list.map((a: any) => adaptAdmin(a, collegesMap)) : []
  } catch (error: any) {
    ElMessage.error(error.message || '加载学院管理员失败')
  }
}

const loadColleges = async () => {
  try {
    colleges.value = await collegeApi.getColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '加载学院列表失败')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleEdit = (admin: Admin) => {
  editingAdmin.value = admin
  form.name = admin.name
  form.username = admin.username
  form.collegeId = admin.collegeId
  showAddDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingAdmin.value) {
          const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdPatch(String(editingAdmin.value.id), {
            realName: form.name,
            collegeId: form.collegeId || undefined
          } as any)
          await req()
          ElMessage.success('编辑成功')
        } else {
          const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsPost({
            username: form.username,
            password: form.password,
            realName: form.name,
            collegeId: form.collegeId as number
          } as any)
          await req()
          ElMessage.success('添加成功')
        }
        showAddDialog.value = false
        resetForm()
        await loadAdmins()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleDisable = async (admin: Admin) => {
  try {
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdStatusPatch(String(admin.id), { status: 'INACTIVE' } as any)
    await req()
    ElMessage.success('已停用')
    await loadAdmins()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (admin: Admin) => {
  try {
    const req = await PlatformApiFp(apiConfig).apiPlatformCollegeAdminsIdStatusPatch(String(admin.id), { status: 'ACTIVE' } as any)
    await req()
    ElMessage.success('已启用')
    await loadAdmins()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const downloadTemplate = () => {
  downloadCollegeAdminTemplate()
  ElMessage.success('模板下载成功，请填写后上传')
}

const handleImport = async () => {
  const fileInput = document.querySelector('.el-upload__input') as HTMLInputElement
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    ElMessage.warning('请选择Excel文件')
    return
  }
  
  try {
    const { parseExcel, validateCollegeAdminData } = await import('@/utils/excelParser')
    const rows = await parseExcel(fileInput.files[0])
    const validation = validateCollegeAdminData(rows)

    if (!validation.valid) {
      ElMessage.error(`数据验证失败：\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...' : ''}`)
      return
    }

    // 调用后端创建接口逐条创建学院管理员
    try {
      const resp = await collegeApi.importAdmins(validation.data)
      ElMessage.success(`已提交导入请求，已创建 ${Array.isArray(resp) ? resp.length : 0} 条管理员`)
      showImportDialog.value = false
      // 刷新或提示后端结果
      // await loadAdmins()
    } catch (err: any) {
      ElMessage.error(err.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  }
}

const resetForm = () => {
  editingAdmin.value = null
  form.name = ''
  form.username = ''
  form.collegeId = null
  form.password = ''
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.college-admins-page {
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
}
</style>


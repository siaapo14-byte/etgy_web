<template>
  <div class="volunteers-page">
    <div class="page-header">
      <h2>志愿者管理</h2>
      <el-button type="primary" @click="showImportDialog = true">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
      <el-button type="success" @click="openAddDialog">
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
        <el-table-column prop="password" label="密码" width="180">
          <template #default="{ row }">
            <div class="password-cell">
              <span v-if="!visiblePasswords[row.id]">{{ '****'.repeat(3) }}</span>
              <span v-else class="visible-password">{{ (row as any).password }}</span>
              <el-button link type="primary" size="small" @click="handleTogglePasswordVisibility(row)">
                {{ visiblePasswords[row.id] ? '隐藏' : '显示' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            
            <el-dropdown @command="(command: 'IN_SCHOOL' | 'SUSPENDED' | 'GRADUATED') => handleStatusChange(row, command)" style="margin-left: 8px">
              <el-button type="info" size="small">
                状态管理 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    command="IN_SCHOOL" 
                    :disabled="row.status === 'active'"
                  >
                    <el-icon><Check /></el-icon> 设为在校
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="SUSPENDED" 
                    :disabled="row.status === 'frozen'"
                  >
                    <el-icon><Lock /></el-icon> 设为停用
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="GRADUATED" 
                    :disabled="row.status === 'inactive'"
                  >
                    <el-icon><UserFilled /></el-icon> 设为已毕业
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入登录账号" />
        </el-form-item>

        <el-form-item label="初始密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入初始密码" show-password />
        </el-form-item>

        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="学号" prop="studentId">
          <el-input v-model="form.studentId" placeholder="请输入学号" />
        </el-form-item>

        <el-form-item label="学院" prop="collegeId">
          <el-input
            :model-value="userStore.user?.collegeName || (form.collegeId != null ? String(form.collegeId) : '')"
            disabled
            placeholder="登录后自动带入"
          />
          <div style="margin-top: 6px; color: #999; font-size: 12px">
            学院管理员创建志愿者时，学院由当前账号自动确定。
          </div>
        </el-form-item>

        <el-form-item label="联系方式" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系方式" />
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
        accept=".xlsx,.xls"
        :limit="1"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            支持格式：.xlsx（请使用下载的模板填写后上传）
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Download, Plus, Upload, Check, Lock, UserFilled, ArrowDown } from '@element-plus/icons-vue'
import { volunteerApi } from '@/utils/api'
import { downloadVolunteerTemplate } from '@/utils/excelTemplate'
import type { Volunteer } from '@/utils/mockData'
import { useUserStore } from '@/stores/user'

const volunteers = ref<Volunteer[]>([])
const userStore = useUserStore()
const filters = reactive({
  status: '',
  keyword: ''
})

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingVolunteer = ref<Volunteer | null>(null)
const formRef = ref<FormInstance>()

// 密码显示状态：默认掩码，点击显示/隐藏
const visiblePasswords = ref<Record<number, boolean>>({})

const form = reactive({
  username: '',
  password: '',
  realName: '',
  studentId: '',
  collegeId: (userStore.user?.collegeId ?? null) as number | null,
  phone: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
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

// 说明：当前 swagger 客户端里没有“查看志愿者真实密码”的接口。
// 因此这里按产品体验做一个一致的交互：默认 *****，点击“显示”时尽量展示本地可得的初始密码：
// - 若该行已缓存过 password（例如刚创建/刚修改），直接展示
// - 否则兜底展示导入/默认初始密码 123456（后端如有不同，请补充对应查看密码接口后再替换这里）
const handleTogglePasswordVisibility = async (volunteer: Volunteer) => {
  const id = (volunteer as any).id as number
  if (!id) return

  if (visiblePasswords.value[id]) {
    visiblePasswords.value[id] = false
    return
  }

  // 首次显示：尽量从已有字段拿，否则兜底 123456
  if (!(volunteer as any).password) {
    ;(volunteer as any).password = '123456'
  }
  visiblePasswords.value[id] = true
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
  // 当前后端未提供“编辑志愿者信息”接口；这里仅用于复用弹窗展示，不允许保存
  // 同时尽量填充能看到的信息（账号/密码通常取不到）
  form.username = (volunteer as any).username || volunteer.studentId || ''
  form.password = ''
  form.realName = volunteer.name || ''
  form.studentId = volunteer.studentId || ''
  form.collegeId = (userStore.user?.collegeId ?? (volunteer as any).collegeId ?? null) as any
  form.phone = volunteer.phone || ''
  showAddDialog.value = true
}

const openAddDialog = () => {
  editingVolunteer.value = null
  // 打开弹窗时强制把学院信息同步到表单里（避免 init 时 user 为空导致 collegeId 仍为 null）
  form.collegeId = (userStore.user?.collegeId ?? null) as any
  showAddDialog.value = true
  // 注意：collegeId 是不可编辑字段，不走 rules 校验；这里在打开时尽早提示更友好
  if (form.collegeId == null) {
    ElMessage.warning('当前登录信息缺少学院信息（collegeId），请重新登录后再创建志愿者')
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingVolunteer.value) {
          // 注意：当前 OpenAPI 未看到“编辑志愿者信息”的 PATCH 接口，这里避免误报成功。
          throw new Error('当前不支持编辑志愿者信息，请使用批量导入覆盖或联系后端补充接口')
        }

        // 再兜底一次：collegeId 为不可编辑字段，不参与 rules 校验；提交前强校验
        if (form.collegeId == null) {
          form.collegeId = (userStore.user?.collegeId ?? null) as any
        }
        if (form.collegeId == null) {
          throw new Error('缺少学院信息（collegeId），请重新登录后重试')
        }

        await volunteerApi.createVolunteer({
          username: form.username,
          password: form.password,
          realName: form.realName,
          studentId: form.studentId,
          collegeId: form.collegeId,
          phone: form.phone
        } as any)

        ElMessage.success('添加成功')
        showAddDialog.value = false
        resetForm()
        await loadVolunteers()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleStatusChange = async (volunteer: Volunteer, status: 'IN_SCHOOL' | 'SUSPENDED' | 'GRADUATED') => {
  const statusMap = {
    IN_SCHOOL: '在校',
    SUSPENDED: '停用', 
    GRADUATED: '已毕业'
  }
  
  // 前端使用小写状态，API使用大写（但具体值不同）
  const frontendToApiStatusMap = {
    active: 'IN_SCHOOL',
    frozen: 'SUSPENDED',
    inactive: 'GRADUATED'
  }
  
  const currentApiStatus = frontendToApiStatusMap[volunteer.status as keyof typeof frontendToApiStatusMap] || volunteer.status?.toUpperCase()
  const currentStatusText = statusMap[currentApiStatus as keyof typeof statusMap] || volunteer.status
  const newStatusText = statusMap[status]
  
  try {
    await ElMessageBox.confirm(
      `确认将志愿者 ${volunteer.name} 的状态从 "${currentStatusText}" 修改为 "${newStatusText}" 吗？`,
      '状态修改确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await volunteerApi.setVolunteerStatus(volunteer.id!, status)
    ElMessage.success(`已将 ${volunteer.name} 的状态修改为 "${newStatusText}"`)
    await loadVolunteers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '状态修改失败')
    }
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
  form.username = ''
  form.password = ''
  form.realName = ''
  form.studentId = ''
  form.collegeId = (userStore.user?.collegeId ?? null) as any
  form.phone = ''
  // resetFields 可能会把 collegeId 重置为初始值（初始值可能是 null），这里用手动清空更稳
  formRef.value?.clearValidate()
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

  .password-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .visible-password {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #333;
      font-weight: 500;
      letter-spacing: 2px;
    }
  }
}
</style>


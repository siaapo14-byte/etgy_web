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

          <el-form-item label="学校">
            <el-input v-model="filters.school" placeholder="请输入学校名称" clearable style="width: 200px" />
          </el-form-item>

          <el-form-item label="姓名/账号">
            <el-input v-model="filters.keyword" placeholder="请输入姓名或账号" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div style="margin-bottom: 12px">
        <el-button type="success" :disabled="selectedRows.length === 0" @click="handleBatchActivate">
          批量启用
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDeactivate">
          批量停用
        </el-button>
        <span v-if="selectedRows.length" style="margin-left: 10px; color: #666; font-size: 12px">
          已选择 {{ selectedRows.length }} 项
        </span>
      </div>
      
      <el-table :data="filteredChildren" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="school" label="学校" width="200" />
        <el-table-column prop="password" label="密码" width="180">
          <template #default="{ row }">
            <div class="password-cell">
              <span v-if="!visiblePasswords[row.id]">{{ '****'.repeat(3) }}</span>
              <span v-else class="visible-password">{{ row.password }}</span>
              <el-button
                link
                type="primary"
                size="small"
                @click="handleTogglePasswordVisibility(row)"
              >
                {{ visiblePasswords[row.id] ? '隐藏' : '显示' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
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

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEditPassword(row)"
            >
              修改密码
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              type="danger"
              size="small"
              @click="handleDeactivate(row)"
            >
              停用
            </el-button>
            <el-button
              v-else
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
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入儿童账号"
      width="600px"
    >
      <el-form :model="importForm" label-width="120px">
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
            accept=".xlsx,.xls"
            :limit="1"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持格式：.xlsx（请使用下载的模板填写后上传）
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

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改儿童账号密码"
      width="500px"
    >
      <div v-if="editingChild" style="margin-bottom: 20px; padding: 12px; background: #f5f7fa; border-radius: 6px">
        <p><strong>账号：</strong> {{ editingChild.username }}</p>
        <p><strong>姓名：</strong> {{ editingChild.name }}</p>
      </div>
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="新密码">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（至少6位）" 
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPasswordChange">确认修改</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import { childApi } from '@/utils/api'
import type { Child } from '@/utils/mockData'

const children = ref<Child[]>([])
const filters = reactive({
  grade: '',
  school: '',
  keyword: ''
})

const selectedRows = ref<Child[]>([])

// 密码相关状态
const visiblePasswords = ref<Record<number, boolean>>({})
const passwordDialogVisible = ref(false)
const editingChild = ref<Child | null>(null)
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const passwordLoading = ref<Record<number, boolean>>({})

const normalizeGrade = (g: any): string => {
  const s = String(g ?? '').trim()
  if (!s) return ''
  // 统一到：“一/二/三/四/五/六年级”
  // 后端可能返回："2"、"2年级"、"二"、"二年级"、"二年级(上)"、"二年级上" 等
  const cleaned = s
    .replace(/\s+/g, '')
    .replace(/[()（）【】\[\]{}]/g, '')

  // 先尝试抽取数字（"2" / "2年级" / "二年级上"(不含数字)）
  const digitMatch = cleaned.match(/\d+/)
  const digit = digitMatch ? parseInt(digitMatch[0], 10) : NaN
  if (!Number.isNaN(digit) && digit >= 1 && digit <= 6) {
    const mapDigit: Record<number, string> = {
      1: '一年级',
      2: '二年级',
      3: '三年级',
      4: '四年级',
      5: '五年级',
      6: '六年级'
    }
    return mapDigit[digit]
  }

  // 再用中文数字/常见写法兜底
  const map: Record<string, string> = {
    '一年级': '一年级',
    '二年级': '二年级',
    '三年级': '三年级',
    '四年级': '四年级',
    '五年级': '五年级',
    '六年级': '六年级',
    '一': '一年级',
    '二': '二年级',
    '三': '三年级',
    '四': '四年级',
    '五': '五年级',
    '六': '六年级',
    '一上': '一年级',
    '一下': '一年级',
    '二上': '二年级',
    '二下': '二年级',
    '三上': '三年级',
    '三下': '三年级',
    '四上': '四年级',
    '四下': '四年级',
    '五上': '五年级',
    '五下': '五年级',
    '六上': '六年级',
    '六下': '六年级'
  }

  if (map[cleaned]) return map[cleaned]
  if (cleaned.endsWith('年级') && map[cleaned.slice(0, -2)]) return map[cleaned.slice(0, -2)]
  if (cleaned.endsWith('年级上') && map[cleaned.slice(0, -3)]) return map[cleaned.slice(0, -3)]
  if (cleaned.endsWith('年级下') && map[cleaned.slice(0, -3)]) return map[cleaned.slice(0, -3)]

  return cleaned
}

const showImportDialog = ref(false)
const importForm = reactive({
  file: null as File | null
})

const filteredChildren = computed(() => {
  let result = children.value
  
  if (filters.grade) {
    const target = normalizeGrade(filters.grade)
    result = result.filter(c => normalizeGrade((c as any).grade) === target)
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

const loadData = async (params?: { grade?: string; school?: string; keyword?: string }) => {
  try {
    const p = params || {}
    const grade = p.grade ? String(p.grade) : ''
    const school = p.school ? String(p.school).trim() : ''
    const search = p.keyword ? String(p.keyword).trim() : ''

    // 后端筛选：school/grade/search
    // grade：优先尝试提取数字（如“二年级” -> 2），没提取到则原样传
    let backendGrade: string | undefined
    if (grade) {
      const digitMatch = grade.match(/\d+/)
      if (digitMatch) {
        backendGrade = digitMatch[0]
      } else {
        const mapZhToDigit: Record<string, string> = {
          '一年级': '1',
          '二年级': '2',
          '三年级': '3',
          '四年级': '4',
          '五年级': '5',
          '六年级': '6'
        }
        backendGrade = mapZhToDigit[normalizeGrade(grade)] || grade
      }
    }

    children.value = await childApi.getChildren({
      grade: backendGrade,
      school: school || undefined,
      search: search || undefined
    })
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 走后端筛选（学校/年级/搜索）
  loadData({ grade: filters.grade, school: filters.school, keyword: filters.keyword })
}

const handleReset = () => {
  filters.grade = ''
  filters.school = ''
  filters.keyword = ''
  loadData()
}

const handleSelectionChange = (rows: Child[]) => {
  selectedRows.value = rows
}

const handleBatchDeactivate = async () => {
  const list = selectedRows.value
  if (!list.length) return
  let ok = 0
  let fail = 0
  await Promise.all(
    list.map(async (c) => {
      try {
        await childApi.setChildStatus(c.id, 'INACTIVE')
        ok++
      } catch {
        fail++
      }
    })
  )
  ElMessage.success(`批量停用完成：成功 ${ok}，失败 ${fail}`)
  await loadData()
}

const handleBatchActivate = async () => {
  const list = selectedRows.value
  if (!list.length) return
  let ok = 0
  let fail = 0
  await Promise.all(
    list.map(async (c) => {
      try {
        await childApi.setChildStatus(c.id, 'ACTIVE')
        ok++
      } catch {
        fail++
      }
    })
  )
  ElMessage.success(`批量启用完成：成功 ${ok}，失败 ${fail}`)
  await loadData()
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

const handleDeactivate = async (child: Child) => {
  try {
    await childApi.setChildStatus(child.id, 'INACTIVE')
    ElMessage.success('已停用')
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleActivate = async (child: Child) => {
  try {
    await childApi.setChildStatus(child.id, 'ACTIVE')
    ElMessage.success('已启用')
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 密码处理函数：默认显示 *****；点击“显示”时请求真实密码并展示；再次点击则隐藏
const handleTogglePasswordVisibility = async (child: Child) => {
  const id = child.id
  if (visiblePasswords.value[id]) {
    visiblePasswords.value[id] = false
    return
  }

  // 如果列表里本来就没 password 字段（安全起见），这里点击时再拉取
  try {
    passwordLoading.value[id] = true
    const pwd = await childApi.getChildPassword(id)
    ;(child as any).password = pwd || ''
    visiblePasswords.value[id] = true
  } catch (e: any) {
    ElMessage.error(e?.message || '获取密码失败')
  } finally {
    passwordLoading.value[id] = false
  }
}

const handleEditPassword = (child: Child) => {
  editingChild.value = child
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const confirmPasswordChange = async () => {
  if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请输入新密码和确认密码')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  
  if (!editingChild.value) return
  
  try {
    await childApi.setChildPassword(editingChild.value.id, passwordForm.newPassword)
    
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '密码修改失败')
  }
}

const handleImport = async () => {
  if (!importForm.file) {
    ElMessage.warning('请选择Excel文件')
    return
  }

  const name = importForm.file.name?.toLowerCase?.() || ''
  if (!(name.endsWith('.xlsx') || name.endsWith('.xls'))) {
    ElMessage.warning('请选择 .xlsx 格式的模板文件')
    return
  }

  try {
    // 由后端负责校验与返回错误明细
    const resp: any = await childApi.importChildren(importForm.file)
    const successCount = resp?.successCount ?? resp?.created
    const failedCount = resp?.failedCount ?? resp?.failed

    if (typeof successCount === 'number' || typeof failedCount === 'number') {
      ElMessage.success(`已提交导入：成功 ${successCount ?? 0} 条，失败 ${failedCount ?? 0} 条。`)
    } else {
      ElMessage.success('已提交导入请求，请稍后刷新查看结果')
    }

    showImportDialog.value = false
    importForm.file = null
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '导入失败')
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


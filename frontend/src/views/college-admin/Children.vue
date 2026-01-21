<template>
  <div class="children-page">
    <div class="page-header">
      <h2>儿童账号管理</h2>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'active'"
              type="warning"
              size="small"
              @click="handleDeactivate(row)"
            >
              停用
            </el-button>
            <el-button
              v-if="row.status === 'inactive'"
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
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑儿童账号"
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
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </el-form-item>
        <el-form-item label="学校" prop="school">
          <el-input v-model="form.school" placeholder="请输入学校" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入儿童账号"
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
            <p>2. 性别请填写：男 或 女</p>
            <p>3. 年级请填写：一年级、二年级、三年级、四年级、五年级、六年级</p>
            <p>4. 请勿修改表头，删除示例行后填写实际数据</p>
            <p>5. 每行代表一个儿童账号</p>
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
import { childApi } from '@/utils/api'
import { downloadChildrenTemplate } from '@/utils/excelTemplate'
import type { Child } from '@/utils/mockData'

const children = ref<Child[]>([])
const filters = reactive({
  grade: '',
  keyword: ''
})

const showEditDialog = ref(false)
const showImportDialog = ref(false)
const editingChild = ref<Child | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  gender: 'male' as 'male' | 'female',
  grade: '',
  school: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  school: [{ required: true, message: '请输入学校', trigger: 'blur' }]
}

const filteredChildren = computed(() => {
  let result = children.value
  
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
  await loadChildren()
})

const loadChildren = async () => {
  try {
    children.value = await childApi.getChildren()
  } catch (error: any) {
    ElMessage.error(error.message || '加载儿童列表失败')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  filters.grade = ''
  filters.keyword = ''
}

const handleEdit = (child: Child) => {
  editingChild.value = child
  form.name = child.name
  form.gender = child.gender
  form.grade = child.grade
  form.school = child.school
  showEditDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用API保存
        ElMessage.success('保存成功')
        showEditDialog.value = false
        resetForm()
        await loadChildren()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleDeactivate = async (child: Child) => {
  try {
    // TODO: 调用API停用
    ElMessage.success('已停用')
    await loadChildren()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleActivate = async (child: Child) => {
  try {
    // TODO: 调用API启用
    ElMessage.success('已启用')
    await loadChildren()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const downloadTemplate = () => {
  downloadChildrenTemplate()
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
    const { parseExcel, validateChildrenData } = await import('@/utils/excelParser')
    const rows = await parseExcel(importFile.value)
    const validation = validateChildrenData(rows)
    
    if (!validation.valid) {
      ElMessage.error(`数据验证失败：\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...' : ''}`)
      return
    }
    
    // 模拟导入（实际应该调用API）
    const newChildren = validation.data.map((item, index) => ({
      id: children.value.length + index + 1,
      name: item.name,
      username: `child_${Date.now()}_${index}`,
      gender: item.gender,
      grade: item.grade,
      school: item.school,
      collegeId: 1, // 当前学院
      collegeName: '数学学院', // TODO: 从用户信息获取
      status: 'active' as const,
      createdAt: new Date().toISOString()
    }))
    
    children.value.push(...newChildren)
    ElMessage.success(`成功导入 ${newChildren.length} 条数据`)
    showImportDialog.value = false
    importFile.value = null
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  }
}

const resetForm = () => {
  editingChild.value = null
  form.name = ''
  form.gender = 'male'
  form.grade = ''
  form.school = ''
  formRef.value?.resetFields()
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


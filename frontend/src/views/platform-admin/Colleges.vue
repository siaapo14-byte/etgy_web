<template>
  <div class="colleges-page">
    <div class="page-header">
      <h2>学院管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加学院
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="colleges" style="width: 100%">
        <el-table-column prop="name" label="学院名称" width="200" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.isActive"
              type="warning"
              size="small"
              @click="handleDisable(row)"
            >
              停用
            </el-button>
            <el-button
              v-if="!row.isActive"
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
      :title="editingCollege ? '编辑学院' : '添加学院'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="学院名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入学院名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
          <el-form-item label="状态" prop="isActive">
            <el-switch v-model="form.isActive" />
          </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { collegeApi } from '@/utils/api'
import type { College } from '@/utils/mockData'

const colleges = ref<College[]>([])
const showAddDialog = ref(false)
const editingCollege = ref<College | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  sortOrder: 0,
  isActive: true
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入学院名称', trigger: 'blur' }]
}

onMounted(async () => {
  await loadColleges()
})

const loadColleges = async () => {
  try {
    colleges.value = await collegeApi.getColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '加载学院列表失败')
  }
}

const handleEdit = (college: College) => {
  editingCollege.value = college
  form.name = college.name
    form.sortOrder = college.sortOrder
    form.isActive = college.isActive
  showAddDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingCollege.value) {
          await collegeApi.updateCollege(editingCollege.value.id, {
            name: form.name,
              sortOrder: form.sortOrder,
              isActive: form.isActive
          })
          ElMessage.success('编辑成功')
        } else {
          await collegeApi.createCollege({ name: form.name, sortOrder: form.sortOrder, isActive: form.isActive })
          ElMessage.success('添加成功')
        }
        showAddDialog.value = false
        resetForm()
        await loadColleges()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const handleDisable = async (college: College) => {
  try {
    await collegeApi.updateCollege(college.id, { isActive: false })
    ElMessage.success('已停用')
    await loadColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (college: College) => {
  try {
    await collegeApi.updateCollege(college.id, { isActive: true })
    ElMessage.success('已启用')
    await loadColleges()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const resetForm = () => {
  editingCollege.value = null
  form.name = ''
    form.sortOrder = 0
    form.isActive = true
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.colleges-page {
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
}
</style>


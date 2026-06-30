<template>
  <div class="sensitive-words-page">
    <div class="page-header">
      <h2>敏感词库配置</h2>
      <div>
        <el-button type="primary" @click="showBatchDialog = true">
          <el-icon><Plus /></el-icon>
          批量添加
        </el-button>
        <el-button type="success" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加敏感词
        </el-button>
      </div>
    </div>

    <p class="subtitle">
      敏感词库用于评论 / 弹幕审核的第一层自动过滤：命中后可直接拦截或标记进入人工复核。
    </p>

    <el-card>
      <div class="filter-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索敏感词"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.isActive" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
              <el-option label="启用" :value="true" />
              <el-option label="停用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="words" style="width: 100%">
        <el-table-column prop="word" label="敏感词" min-width="200" />
        <el-table-column prop="isActive" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="row.isActive ? 'warning' : 'success'"
              size="small"
              @click="handleToggleActive(row)"
            >
              {{ row.isActive ? '停用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 添加单个敏感词 -->
    <el-dialog v-model="showAddDialog" title="添加敏感词" width="460px">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="90px">
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="addForm.word" placeholder="请输入敏感词" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="addForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmAdd">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加敏感词 -->
    <el-dialog v-model="showBatchDialog" title="批量添加敏感词" width="520px">
      <el-form :model="batchForm" label-width="90px">
        <el-form-item label="敏感词">
          <el-input
            v-model="batchForm.text"
            type="textarea"
            :rows="8"
            placeholder="每行一个敏感词，或用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="覆盖模式">
          <el-switch v-model="batchForm.overwrite" />
          <span class="hint">开启后将清空原词库并以本次为准</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmBatch">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { sensitiveWordApi } from '@/utils/api'

type UiWord = {
  id: number
  word: string
  isActive: boolean
  createdAt: string
}

const words = ref<UiWord[]>([])
const loading = ref(false)
const submitting = ref(false)

const filters = reactive({
  keyword: '',
  isActive: undefined as boolean | undefined
})

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({ word: '', isActive: true })
const addRules: FormRules = {
  word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }]
}
const batchForm = reactive({ text: '', overwrite: false })

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await sensitiveWordApi.getWords({
      q: filters.keyword || undefined,
      isActive: filters.isActive,
      page: page.value,
      pageSize: pageSize.value
    })
    words.value = res.items as UiWord[]
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载敏感词失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handleReset = () => {
  filters.keyword = ''
  filters.isActive = undefined
  page.value = 1
  loadData()
}

const openAddDialog = () => {
  addForm.word = ''
  addForm.isActive = true
  showAddDialog.value = true
}

const confirmAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await sensitiveWordApi.addWord(addForm.word.trim(), addForm.isActive)
      ElMessage.success('添加成功')
      showAddDialog.value = false
      await loadData()
    } catch (e: any) {
      ElMessage.error(e?.message || '添加失败')
    } finally {
      submitting.value = false
    }
  })
}

const confirmBatch = async () => {
  const list = batchForm.text
    .split(/[\n,，]/)
    .map((w) => w.trim())
    .filter(Boolean)

  if (list.length === 0) {
    ElMessage.warning('请输入至少一个敏感词')
    return
  }

  submitting.value = true
  try {
    await sensitiveWordApi.batchAddWords(list, batchForm.overwrite)
    ElMessage.success(`已提交 ${list.length} 个敏感词`)
    showBatchDialog.value = false
    batchForm.text = ''
    batchForm.overwrite = false
    page.value = 1
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量添加失败')
  } finally {
    submitting.value = false
  }
}

const handleToggleActive = async (row: UiWord) => {
  try {
    await sensitiveWordApi.setWordActive(row.id, !row.isActive)
    ElMessage.success(row.isActive ? '已停用' : '已启用')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleDelete = async (row: UiWord) => {
  try {
    await ElMessageBox.confirm(`确定删除敏感词「${row.word}」吗？`, '提示', { type: 'warning' })
    await sensitiveWordApi.deleteWord(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

const formatDate = (dateStr: string) => {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-'
}
</script>

<style scoped lang="scss">
.sensitive-words-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
      margin: 0;
      font-size: 24px;
    }
  }

  .subtitle {
    margin: 8px 0 20px;
    font-size: 13px;
    color: #909399;
  }

  .filter-bar {
    margin-bottom: 16px;
  }

  .hint {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }

  .pagination-bar {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

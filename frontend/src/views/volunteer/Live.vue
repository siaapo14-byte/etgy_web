<template>
  <div class="live-page">
    <div class="page-header">
      <h2>直播申请</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>
        申请直播
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="lives" style="width: 100%">
        <el-table-column prop="title" label="主题" width="250" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长（分钟）" width="120">
          <template #default="{ row }">
            {{ Math.floor(row.duration / 60) }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="150">
          <template #default="{ row }">
            <el-tag v-for="g in row.grade" :key="g" size="small" style="margin-right: 5px">
              {{ g }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimatedViewers" label="预估人数" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'draft'"
              type="primary"
              size="small"
              @click="handleSubmitReview(row.id)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="row.status === 'approved'"
              type="success"
              size="small"
              @click="handlePublish(row.id)"
            >
              上架
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="success"
              size="small"
              @click="handleStartLive(row.id)"
            >
              开始直播
            </el-button>
            <el-button
              v-if="row.status === 'live'"
              type="warning"
              size="small"
              @click="enterLiveRoom(row.id)"
            >
              进入直播间
            </el-button>
            <el-button
              v-if="row.status === 'rejected'"
              type="primary"
              size="small"
              @click="handleEdit(row.id)"
            >
              重新编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 申请直播对话框 -->
    <el-dialog
      v-model="showDialog"
      title="申请直播"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="直播主题" prop="title">
          <el-input v-model="form.title" placeholder="请输入直播主题" />
        </el-form-item>
        
        <el-form-item label="直播简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入直播简介"
          />
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="时长（分钟）" prop="duration">
          <el-input-number
            v-model="form.duration"
            :min="30"
            :max="180"
            :step="30"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="适用年级" prop="grade">
          <el-checkbox-group v-model="form.grade">
            <el-checkbox label="一年级">一年级</el-checkbox>
            <el-checkbox label="二年级">二年级</el-checkbox>
            <el-checkbox label="三年级">三年级</el-checkbox>
            <el-checkbox label="四年级">四年级</el-checkbox>
            <el-checkbox label="五年级">五年级</el-checkbox>
            <el-checkbox label="六年级">六年级</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="学科" prop="subject">
          <el-select v-model="form.subject" placeholder="请选择学科" style="width: 100%">
            <el-option label="数学" value="数学" />
            <el-option label="语文" value="语文" />
            <el-option label="英语" value="英语" />
            <el-option label="科学" value="科学" />
            <el-option label="美术" value="美术" />
            <el-option label="音乐" value="音乐" />
            <el-option label="体育" value="体育" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预估人数" prop="estimatedViewers">
          <el-input-number
            v-model="form.estimatedViewers"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存草稿</el-button>
        <el-button type="success" @click="handleSubmit">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { liveApi } from '@/utils/api'
import type { Live } from '@/utils/mockData'
import { LiveApiFp } from '@/api-services/apis/live-api'
import { apiConfig } from '@/apiClient'

const router = useRouter()

const showDialog = ref(false)
const formRef = ref<FormInstance>()

const lives = ref<Live[]>([])

const form = reactive({
  title: '',
  description: '',
  startTime: '',
  duration: 60,
  grade: [] as string[],
  subject: '',
  estimatedViewers: 30
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入直播主题', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入直播简介', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择适用年级', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadLives()
})

const loadLives = async () => {
  try {
    const data = await liveApi.getMyLives()
    lives.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '加载直播列表失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    published: 'success',
    live: 'success',
    ended: 'info',
    offline: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '审核通过',
    rejected: '审核驳回',
    published: '已上架',
    live: '直播中',
    ended: '已结束',
    offline: '已下架'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 保存草稿：后端创建接口会生成/保持 DRAFT（无需前端传 status）
        await liveApi.createLive({ ...form })
        ElMessage.success('保存草稿成功')
        showDialog.value = false
        resetForm()
        await loadLives()
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      }
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 提交审核：创建后再调用 submitReview
        const created = await liveApi.createLive({ ...form })
        await liveApi.submitReview(created.id)
        ElMessage.success('提交审核成功')
        showDialog.value = false
        resetForm()
        await loadLives()
      } catch (error: any) {
        ElMessage.error(error.message || '提交失败')
      }
    }
  })
}

const handleSubmitReview = async (id: number) => {
  try {
    await liveApi.submitReview(id)
    ElMessage.success('提交审核成功')
    await loadLives()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  }
}

const handlePublish = async (id: number) => {
  try {
    const req = await LiveApiFp(apiConfig).apiLiveIdPublishPost(String(id))
    await req()
    ElMessage.success('上架成功')
    await loadLives()
  } catch (error: any) {
    ElMessage.error(error.message || '上架失败')
  }
}

const enterLiveRoom = (id: number) => {
  router.push(`/volunteer/live/${id}/room`)
}

const handleStartLive = async (id: number) => {
  try {
    await liveApi.startLive(id)
    ElMessage.success('已开始直播')
    router.push(`/volunteer/live/${id}/room`)
  } catch (error: any) {
    ElMessage.error(error.message || '开始直播失败')
  }
}

const handleEdit = (_id: number) => {
  ElMessage.info('编辑功能开发中')
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.startTime = ''
  form.duration = 60
  form.grade = []
  form.subject = ''
  form.estimatedViewers = 30
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.live-page {
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


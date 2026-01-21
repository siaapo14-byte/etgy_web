<template>
  <div class="upload-page">
    <div class="page-header">
      <h2>上传视频</h2>
    </div>
    
    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="视频文件" prop="videoFile">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            accept="video/*"
            :limit="1"
          >
            <el-button type="primary">选择视频文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持格式：mp4, avi, mov等，文件大小不超过500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入视频标题" />
        </el-form-item>
        
        <el-form-item label="视频简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入视频简介"
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
          <el-select v-model="form.subject" placeholder="请选择学科">
            <el-option label="数学" value="数学" />
            <el-option label="语文" value="语文" />
            <el-option label="英语" value="英语" />
            <el-option label="科学" value="科学" />
            <el-option label="美术" value="美术" />
            <el-option label="音乐" value="音乐" />
            <el-option label="体育" value="体育" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="请输入或选择标签"
            style="width: 100%"
          >
            <el-option label="基础" value="基础" />
            <el-option label="进阶" value="进阶" />
            <el-option label="趣味" value="趣味" />
            <el-option label="互动" value="互动" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="success" @click="handleSubmit">提交审核</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import { OSSApiFp } from '@/api-services/apis/ossapi'
import { apiConfig } from '@/apiClient'

const router = useRouter()
const formRef = ref<FormInstance>()
const uploadRef = ref()

const fileList = ref<any[]>([])
const loading = ref(false)
const form = reactive({
  videoFile: null as File | null,
  title: '',
  description: '',
  grade: [] as string[],
  subject: '',
  tags: [] as string[]
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入视频标题', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入视频简介', trigger: 'blur' }
  ],
  grade: [
    { required: true, message: '请选择适用年级', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'blur' }
  ]
}

const handleFileChange = (file: any) => {
  form.videoFile = file.raw
  if (file.raw && file.raw.size > 500 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过500MB')
    uploadRef.value?.clearFiles()
    form.videoFile = null
  }
}

const uploadToOss = async (file: File) => {
  // 1) 获取预签名上传 URL
  const ossReq = await OSSApiFp(apiConfig).apiOssUploadUrlPost({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    prefix: 'videos/'
  } as any)
  const ossRes = await ossReq()
  const data: any = ossRes.data.data || {}
  const uploadUrl = data.uploadUrl || data.url
  if (!uploadUrl) throw new Error('获取上传 URL 失败')

  // 2) 直传到 OSS（PUT）
  const putResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  })
  if (!putResp.ok) throw new Error('上传文件到 OSS 失败')

  // 3) 拿到可公开/可访问的对象地址（去掉 query）
  const objectUrl = data.objectUrl || data.location || uploadUrl.split('?')[0]
  return { objectUrl, key: data.key || data.filename }
}

const createVideoDraft = async (videoUrl: string, coverUrl?: string) => {
  const gradeRange = form.grade.join(',')
  const req = await VideosApiFp(apiConfig).apiVideosPost({
    title: form.title,
    intro: form.description,
    url: videoUrl,
    coverUrl,
    gradeRange,
    subjectTag: form.subject
  } as any)
  const res = await req()
  const data: any = res.data.data
  return data?.id
}

const handleSaveDraft = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (!form.videoFile) {
          ElMessage.warning('请先选择视频文件')
          return
        }
        loading.value = true
        const { objectUrl } = await uploadToOss(form.videoFile)
        const videoId = await createVideoDraft(objectUrl)
        if (!videoId) throw new Error('创建草稿失败')
        ElMessage.success('保存草稿成功')
        router.push('/volunteer/videos')
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  if (!form.videoFile) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 上传文件 -> 创建草稿 -> 提交审核
        const { objectUrl } = await uploadToOss(form.videoFile)
        const videoId = await createVideoDraft(objectUrl)
        if (!videoId) throw new Error('创建草稿失败')
        const submitReq = await VideosApiFp(apiConfig).apiVideosIdSubmitPost(String(videoId))
        await submitReq()
        ElMessage.success('提交审核成功')
        router.push('/volunteer/videos')
      } catch (error: any) {
        ElMessage.error(error.message || '提交失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.upload-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
}
</style>


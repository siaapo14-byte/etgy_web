<template>
  <div class="upload-page">
    <div class="page-header">
      <h2>上传视频</h2>
    </div>
    
    <el-card v-loading="loading" :element-loading-text="loadingText">
      <div v-if="loading" class="progress-wrap">
        <el-progress
          v-if="progressMode === 'determinate'"
          :percentage="progressPercent"
          :stroke-width="14"
          status="success"
        />
        <el-progress
          v-else
          :percentage="100"
          :indeterminate="true"
          :duration="1.2"
          :stroke-width="14"
        />
        <div class="progress-text">{{ progressText }}</div>
      </div>
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
        
        <el-form-item label="视频封面" prop="coverFile">
          <div style="margin-bottom: 12px">
            <el-upload
              :auto-upload="false"
              :on-change="handleCoverChange"
              :file-list="coverFileList"
              accept="image/*"
              :limit="1"
            >
              <el-button type="primary">选择封面图片</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持格式：jpg, png等，建议尺寸16:9，文件大小不超过5MB
                </div>
              </template>
            </el-upload>
          </div>
          <div v-if="form.coverPreview" style="margin-top: 12px">
            <p style="font-size: 12px; color: #666; margin-bottom: 8px">封面预览：</p>
            <img :src="form.coverPreview" alt="视频封面" style="max-width: 200px; max-height: 120px; border-radius: 4px" />
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import { apiConfig } from '@/apiClient'
import { videoApi } from '@/utils/api'

const router = useRouter()
const route = useRoute()
const editingVideoId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const uploadRef = ref()

const fileList = ref<any[]>([])
const coverFileList = ref<any[]>([])
const loading = ref(false)
const loadingText = ref('')
const progressMode = ref<'determinate' | 'indeterminate'>('determinate')
const progressPercent = ref(0)
const progressText = ref('')

// 总进度：视频占比更高，封面占比较低
const videoUploadPercent = ref(0)
const coverUploadPercent = ref(0)
const calcTotalPercent = () => {
  const total = Math.round(videoUploadPercent.value * 0.95 + coverUploadPercent.value * 0.05)
  return Math.max(0, Math.min(100, total))
}
const form = reactive({
  videoFile: null as File | null,
  coverFile: null as File | null,
  coverPreview: '',
  title: '',
  description: '',
  duration: undefined as number | undefined,
  grade: [] as string[],
  subject: '',
  tags: [] as string[]
})

const initFromDraft = async () => {
  const rawId = route.query?.id
  const id = rawId != null ? Number(Array.isArray(rawId) ? rawId[0] : rawId) : NaN
  if (!Number.isFinite(id) || id <= 0) return

  editingVideoId.value = id
  loading.value = true
  loadingText.value = '正在加载草稿…'
  progressMode.value = 'indeterminate'
  progressText.value = '读取草稿信息中'
  try {
    const req = await VideosApiFp(apiConfig).apiVideosIdGet(String(id))
    const res = await req()
    const v: any = res.data.data || {}

    form.title = v.title || ''
    form.description = v.intro || ''
    form.subject = v.subjectTag || ''
    form.grade = v.gradeRange ? String(v.gradeRange).split(',').map((i: string) => i.trim()).filter(Boolean) : []
    // tags 后端字段不明确，保持为空即可

    // 回填封面预览（上传组件的 fileList 不强行回填，避免 element-plus 内部状态复杂）
    form.coverPreview = v.coverUrl || ''

    // 编辑模式下：允许不重新选视频文件/封面文件，仅修改文字信息并重新提交
  } catch (e: any) {
    ElMessage.error(e?.message || '加载草稿失败')
    editingVideoId.value = null
  } finally {
    loading.value = false
    progressText.value = ''
  }
}

onMounted(() => {
  void initFromDraft()
})

const getVideoDurationSeconds = async (file: File): Promise<number | undefined> => {
  try {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    const seconds = await new Promise<number>((resolve, reject) => {
      const cleanup = () => {
        video.onloadedmetadata = null
        video.onerror = null
        try {
          URL.revokeObjectURL(url)
        } catch {}
      }
      video.onloadedmetadata = () => {
        const d = Number(video.duration)
        cleanup()
        resolve(Number.isFinite(d) && d > 0 ? d : 0)
      }
      video.onerror = () => {
        cleanup()
        reject(new Error('读取视频时长失败'))
      }
    })
    // 后端一般用秒；这里取整更稳（避免浮点导致校验失败）
    return Math.max(0, Math.floor(seconds))
  } catch {
    return undefined
  }
}

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
    form.duration = undefined
    return
  }
  if (file.raw) {
    // 异步读取时长，不阻塞 UI
    getVideoDurationSeconds(file.raw).then((d) => {
      form.duration = d
    })
  }
}

const handleCoverChange = (file: any) => {
  form.coverFile = file.raw
  if (file.raw && file.raw.size > 5 * 1024 * 1024) {
    ElMessage.error('封面图片大小不能超过5MB')
    form.coverFile = null
    form.coverPreview = ''
    coverFileList.value = []
    return
  }
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.coverPreview = e.target?.result as string
    }
    reader.readAsDataURL(file.raw)
  }
}

const uploadToOss = async (file: File | null, folder: string, label: string) => {
  if (!file) throw new Error('文件为空')

  // 方案一：预签名直传 OSS
  // 统一走后端代传 /api/oss/upload/{folder}（避免预签名直传的 CORS 与跨域问题）。
  return await videoApi.uploadToOss(file, {
    prefix: folder,
    onProgress: (p) => {
      progressMode.value = 'determinate'
      if (label === '视频') {
        videoUploadPercent.value = p
      } else {
        coverUploadPercent.value = p
      }
      progressPercent.value = calcTotalPercent()
      progressText.value = `${label}上传中（${p}%），总进度 ${progressPercent.value}%`
    }
  })
}

const createVideoDraft = async (videoUrl: string, coverUrl?: string) => {
  const gradeRange = form.grade.join(',')
  const payload: any = {
    title: form.title,
    intro: form.description,
    url: videoUrl,
    duration: form.duration,
    gradeRange,
    subjectTag: form.subject
  }
  if (coverUrl) {
    payload.coverUrl = coverUrl
  }
  
  const req = await VideosApiFp(apiConfig).apiVideosPost(payload)
  const res = await req()
  const data: any = res.data.data
  return data?.id
}

const updateVideoDraft = async (id: number, patch: any) => {
  const req = await VideosApiFp(apiConfig).apiVideosIdPatch(String(id), patch)
  const res = await req()
  return res.data.data
}

const handleSaveDraft = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 编辑模式：允许不重新选择视频文件
        if (!editingVideoId.value && !form.videoFile) {
          ElMessage.warning('请先选择视频文件')
          return
        }
  loading.value = true
  loadingText.value = '正在保存草稿…'
  progressMode.value = 'determinate'
  progressPercent.value = 0
  videoUploadPercent.value = 0
  coverUploadPercent.value = 0
  progressText.value = '准备上传…'

        // 仅在用户重新选择了文件时才上传并更新 url
        let nextVideoUrl: string | undefined
        if (form.videoFile) {
          const { objectUrl } = await uploadToOss(form.videoFile, 'videos', '视频')
          nextVideoUrl = objectUrl
          videoUploadPercent.value = 100
          progressPercent.value = calcTotalPercent()
        }

        // 进入保存阶段（无真实进度，改用不确定进度条）
        progressMode.value = 'indeterminate'
        progressPercent.value = 100
        progressText.value = editingVideoId.value ? '正在保存草稿（更新记录）…' : '正在保存草稿（创建记录）…'
        
        // 上传封面文件（如果有）
        let coverUrl: string | undefined
        if (form.coverFile) {
          // 后端代传接口会校验 folder 白名单；从你的抓包看 videos 允许、uploads 不允许
          // 先让封面也走 videos，确保功能可用；若后端后续放开 covers/images 再改回对应目录
          const { objectUrl: coverObjectUrl } = await uploadToOss(form.coverFile, 'videos', '封面')
          coverUrl = coverObjectUrl
        }

        coverUploadPercent.value = form.coverFile ? 100 : 0
        progressPercent.value = calcTotalPercent()
        
        const gradeRange = form.grade.join(',')
        const patchOrCreate: any = {
          title: form.title,
          intro: form.description,
          duration: form.duration,
          gradeRange,
          subjectTag: form.subject
        }
        if (nextVideoUrl) patchOrCreate.url = nextVideoUrl
        if (coverUrl) patchOrCreate.coverUrl = coverUrl

        let videoId = editingVideoId.value
        if (videoId) {
          await updateVideoDraft(videoId, patchOrCreate)
        } else {
          if (!nextVideoUrl) throw new Error('创建草稿缺少视频地址')
          videoId = await createVideoDraft(nextVideoUrl, coverUrl)
          if (!videoId) throw new Error('创建草稿失败')
          editingVideoId.value = videoId
        }
        ElMessage.success('保存草稿成功')
        router.push('/volunteer/videos')
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        loading.value = false
        loadingText.value = ''
        progressMode.value = 'determinate'
        progressPercent.value = 0
        videoUploadPercent.value = 0
        coverUploadPercent.value = 0
        progressText.value = ''
      }
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  if (!editingVideoId.value && !form.videoFile) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        loadingText.value = '正在提交审核…'
        progressMode.value = 'determinate'
        progressPercent.value = 0
  videoUploadPercent.value = 0
  coverUploadPercent.value = 0
        progressText.value = '准备上传…'

        // 仅在重新选择了文件时才上传并更新 url
        let nextVideoUrl: string | undefined
        if (form.videoFile) {
          const { objectUrl } = await uploadToOss(form.videoFile, 'videos', '视频')
          nextVideoUrl = objectUrl
          videoUploadPercent.value = 100
          progressPercent.value = calcTotalPercent()
        }

        progressMode.value = 'indeterminate'
        progressPercent.value = 100
        progressText.value = editingVideoId.value ? '正在保存草稿（更新记录）…' : '正在保存草稿（创建记录）…'
        
        // 上传封面文件（如果有）
        let coverUrl: string | undefined
        if (form.coverFile) {
          // 与保存草稿一致：避免后端 folder 白名单导致上传成功/失败不一致
          const { objectUrl: coverObjectUrl } = await uploadToOss(form.coverFile, 'videos', '封面')
          coverUrl = coverObjectUrl
        }

        coverUploadPercent.value = form.coverFile ? 100 : 0
        progressPercent.value = calcTotalPercent()
        
        const gradeRange = form.grade.join(',')
        const patchOrCreate: any = {
          title: form.title,
          intro: form.description,
          duration: form.duration,
          gradeRange,
          subjectTag: form.subject
        }
        if (nextVideoUrl) patchOrCreate.url = nextVideoUrl
        if (coverUrl) patchOrCreate.coverUrl = coverUrl

        let videoId = editingVideoId.value
        if (videoId) {
          await updateVideoDraft(videoId, patchOrCreate)
        } else {
          if (!nextVideoUrl) throw new Error('创建草稿缺少视频地址')
          videoId = await createVideoDraft(nextVideoUrl, coverUrl)
          if (!videoId) throw new Error('创建草稿失败')
          editingVideoId.value = videoId
        }

        progressText.value = '正在提交审核…'
        const submitReq = await VideosApiFp(apiConfig).apiVideosIdSubmitPost(String(videoId))
        await submitReq()
        ElMessage.success('提交审核成功')
        router.push('/volunteer/videos')
      } catch (error: any) {
        // 尽量把后端 400 的具体校验信息展示出来
        const detail =
          error?.response?.data
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : ''
        ElMessage.error((error.message || '提交失败') + (detail ? `（后端返回：${detail}）` : ''))
      } finally {
        loading.value = false
        loadingText.value = ''
        progressMode.value = 'determinate'
        progressPercent.value = 0
        videoUploadPercent.value = 0
        coverUploadPercent.value = 0
        progressText.value = ''
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

  .progress-wrap {
    margin-bottom: 16px;
  }

  .progress-text {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  }
}
</style>


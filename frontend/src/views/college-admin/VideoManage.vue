<template>
  <div class="manage-page">
    <div class="page-header">
      <h2>视频状态管理</h2>
    </div>
    
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已上架" value="PUBLISHED" />
            <el-option label="已下架" value="OFFLINE" />
          </el-select>
        </el-form-item>
        <el-form-item label="志愿者">
          <el-input v-model="filters.volunteer" placeholder="搜索志愿者" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="video-grid" @scroll.passive="handleScroll">
      <div v-for="video in filteredVideos" :key="video.id" class="video-item">
        <div class="video-thumb"
          @mouseenter="startHover(video.id)"
          @mouseleave="stopHover(video.id)"
        >
          <!-- 始终渲染 video 用于悬停预览；封面作为覆盖层，播放时自动隐藏 -->
          <video
            :src="video.videoUrl"
            :controls="false"
            muted
            playsinline
            preload="metadata"
            :ref="(el) => setVideoRef(video.id, el)"
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
          />
          <img
            v-if="video.coverUrl"
            v-show="!playingIdMap[video.id]"
            :src="video.coverUrl"
            alt="视频封面"
            class="thumb-cover"
          />
          <div class="video-overlay">
            <div class="dots-menu" @click.stop="openMenu(video)">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        <div class="video-info">
          <div class="video-title">{{ video.title }}</div>
          <div class="video-meta">
            <span>{{ video.volunteerName }}</span>
            <span>{{ getStatusText(video.status) }}</span>
            <span>{{ video.playCount }}次播放</span>
          </div>
        </div>
      </div>
      <div v-if="loadingMore" class="loading-more">加载中...</div>
    </div>
    <el-dropdown v-if="menuVisible" :visible="menuVisible" @visible-change="menuVisible = $event" :teleported="false" :style="{ position: 'fixed', left: menuX + 'px', top: menuY + 'px', zIndex: 9999 }">
      <el-dropdown-menu>
        <el-dropdown-item @click="handlePublish(menuVideo)">发布</el-dropdown-item>
        <el-dropdown-item @click="handleOffline(menuVideo)">下线</el-dropdown-item>
        <el-dropdown-item @click="handlePreview(menuVideo)">预览</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    
    <!-- 下线对话框 -->
    <el-dialog
      v-model="offlineDialogVisible"
      title="下线理由"
      width="500px"
    >
      <el-form :model="offlineForm">
        <el-form-item label="下线理由">
          <el-input
            v-model="offlineForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入下线理由（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="offlineDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmOffline">确认下线</el-button>
      </template>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="previewDialogVisible" :video="currentPreviewVideo" :isMine="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { videoApi } from '@/utils/api'
import type { Video } from '@/utils/mockData'
import VideoPreviewDialog from '@/components/VideoPreviewDialog.vue'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import type { Video as ApiVideo } from '@/api-services/models'
import { apiConfig } from '@/apiClient'
import { useUserStore } from '@/stores/user'

// 状态定义
const videos = ref<Video[]>([]) // 存储所有视频（或当前页视频）
const loadingMore = ref(false)
const menuVisible = ref(false)
const menuVideo = ref<any>(null)
const menuX = ref(0)
const menuY = ref(0)
const videoRefs = reactive<Record<number, HTMLVideoElement | null>>({})
const hoverTimers = reactive<Record<number, any>>({})
const playingIdMap = reactive<Record<number, boolean>>({})
const currentPlayingId = ref<number | null>(null)

const filters = reactive({
  status: 'PUBLISHED',
  volunteer: ''
})

const userStore = useUserStore()

const offlineDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const currentOfflineVideo = ref<Video | null>(null)
const currentPreviewVideo = ref<Video | null>(null)
const offlineForm = reactive({
  reason: ''
})

// 加载逻辑
const loadVideos = async () => {
  loadingMore.value = true
  try {
    // 学院管理员端：视频状态管理应展示“本学院已上架视频”，按 /api/videos 拉取后按 collegeId 过滤
    const status = filters.status ? String(filters.status).toUpperCase() : 'PUBLISHED'
    const myCollegeId = userStore.user?.collegeId
    const req = await VideosApiFp(apiConfig).apiVideosGet(
      status,
      typeof myCollegeId === 'number' ? String(myCollegeId) : undefined,
      undefined,
      undefined,
      filters.volunteer || undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    )
    const res = await req()
    const data: any = (res as any)?.data?.data
    const listRaw = Array.isArray(data) ? data : (data?.list ?? data?.records ?? data?.items ?? [])
    const list: ApiVideo[] = (Array.isArray(listRaw) ? listRaw : []) as any

    const listInMyCollege = typeof myCollegeId === 'number'
      ? list.filter((v: any) => Number(v.collegeId ?? (v.college as any)?.id) === myCollegeId)
      : list

    const allVideos: Video[] = listInMyCollege.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.intro || '',
      coverUrl: v.coverUrl || '',
      videoUrl: v.url,
      duration: v.duration || 0,
      grade: v.gradeRange ? String(v.gradeRange).split(',').map((i: string) => i.trim()).filter(Boolean) : [],
      subject: v.subjectTag || '',
      tags: [],
    // 统一用大写枚举，方便筛选与展示
    status: String(v.status || '').toUpperCase() as any,
      volunteerId: v.uploaderId,
      volunteerName: v.uploaderName || (v.uploader as any)?.name || '',
      collegeId: v.collegeId,
      collegeName: v.collegeName || (v.college as any)?.name || '',
      playCount: v.metrics?.playCount ?? 0,
      likeCount: v.metrics?.likeCount ?? 0,
      collectCount: v.metrics?.favCount ?? 0,
      createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : (v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString()),
      reviewReason: v.rejectReason || undefined,
      reviewTime: v.reviewedAt ? new Date(v.reviewedAt).toISOString() : undefined,
      reviewerName: v.reviewerName || ''
    } as any))
    
    // 简单模拟分页追加效果（如果已经是全部数据则直接赋值）
    if (videos.value.length === 0) {
      videos.value = allVideos
    } else {
      // 如果后端支持分页，这里应该是追加新数据
      // 目前演示环境还是全部替换或保持不变
      // videos.value = [...videos.value, ...newVideos]
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载视频列表失败')
  } finally {
    loadingMore.value = false
  }
}

// 滚动加载
function handleScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 100 && !loadingMore.value) {
    // 触发加载更多（如果API支持分页）
    // loadVideos()
  }
}

// 过滤计算属性
const filteredVideos = computed(() => {
  let result = videos.value
  
  if (filters.status) {
    result = result.filter(v => String(v.status || '').toUpperCase() === String(filters.status).toUpperCase())
  }
  
  if (filters.volunteer) {
    result = result.filter(v => 
      v.volunteerName.includes(filters.volunteer)
    )
  }
  
  return result
})

// 悬停播放逻辑
function setVideoRef(id: number, el: HTMLVideoElement | null) {
  videoRefs[id] = el
}

function startHover(id: number) {
  // 若已有其它视频在预览，先停止，避免同时播放
  if (currentPlayingId.value !== null && currentPlayingId.value !== id) {
    stopHover(currentPlayingId.value)
  }

  hoverTimers[id] = setTimeout(() => {
    const v = videoRefs[id]
    if (v) {
      try {
        playingIdMap[id] = true
        currentPlayingId.value = id
        // 避免浏览器对自动播放的限制：muted + playsinline
        v.muted = true
        const p = v.play()
        if (p && typeof (p as any).catch === 'function') {
          ;(p as any).catch(() => {
            // 自动播放可能被阻止，保持封面不隐藏
            playingIdMap[id] = false
          })
        }
      } catch {
        playingIdMap[id] = false
      }
    }
  }, 1000)
}

function stopHover(id: number) {
  clearTimeout(hoverTimers[id])
  const v = videoRefs[id]
  if (v) {
    v.pause()
    v.currentTime = 0 // 重置播放进度
  }
  playingIdMap[id] = false
  if (currentPlayingId.value === id) currentPlayingId.value = null
}

// 菜单逻辑
function openMenu(video: any) {
  menuVideo.value = video
  menuVisible.value = true
  nextTick(() => {
    // 定位到鼠标位置
    const event = window.event as MouseEvent
    if (event) {
      menuX.value = event.clientX
      menuY.value = event.clientY
    }
  })
}

// 工具函数
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: '审核通过',
    PUBLISHED: '已上架',
    OFFLINE: '已下架'
  }
  return map[status] || status
}

// 事件处理
const handleSearch = () => {
  // 重新加载或由computed自动处理
  loadVideos()
}

const handleReset = () => {
  filters.status = 'PUBLISHED'
  filters.volunteer = ''
  loadVideos()
}

const handlePublish = async (video: Video) => {
  try {
    await ElMessageBox.confirm('确定要发布这个视频吗？发布后儿童可见。', '提示', {
      type: 'warning'
    })
    await videoApi.togglePublish(video.id, 'publish')
    ElMessage.success('发布成功')
    await loadVideos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

const handleOffline = (video: Video) => {
  currentOfflineVideo.value = video
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmOffline = async () => {
  if (!offlineForm.reason) {
    ElMessage.warning('请输入下线理由')
    return
  }
  
  try {
    await videoApi.togglePublish(currentOfflineVideo.value!.id, 'offline')
    // 这里应该调用设置理由的API，待补充
    ElMessage.success('下线成功')
    offlineDialogVisible.value = false
    await loadVideos()
  } catch (error: any) {
    ElMessage.error(error.message || '下线失败')
  }
}

const handlePreview = (video: Video) => {
  currentPreviewVideo.value = video
  previewDialogVisible.value = true
}

onMounted(() => {
  loadVideos()
})
</script>

<style scoped lang="scss">
  .video-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
    background: #f8f8f8;
    border-radius: 12px;
  }
  .video-item {
    position: relative;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .video-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    border-radius: 8px;
    background: #000;
  }
  .thumb-cover {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    background: #f0f0f0;
  }
  .video-overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .dots-menu {
    position: absolute;
    left: 12px;
    top: 12px;
    width: 32px;
    height: 32px;
    background: rgba(0,0,0,0.3);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    pointer-events: auto;
    cursor: pointer;
    z-index: 2;
    transition: background 0.2s;
  }
  .dots-menu span {
    display: block;
    width: 6px;
    height: 6px;
    background: #fff;
    border-radius: 50%;
  }
  .video-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #333;
  }
  .video-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 2px;
  }
  .video-meta {
    display: flex;
    gap: 12px;
    color: #888;
  }
  .loading-more {
    grid-column: span 2;
    text-align: center;
    color: #888;
    padding: 16px;
  }
.manage-page {
  .page-header {
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


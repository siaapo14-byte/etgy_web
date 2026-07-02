<template>
  <div class="live-room">
    <div
      ref="stageRef"
      class="live-room__stage"
      :class="{ 'live-room__stage--fullscreen': isFullscreen }"
    >
      <div ref="localVideoRef" class="live-room__video" />

      <div v-if="isLoading" class="live-room__loading">
        <div class="live-room__loading-card">
          <el-icon class="live-room__loading-icon is-loading">
            <Loading />
          </el-icon>
          <p class="live-room__loading-title">{{ loadingTitle }}</p>
          <p class="live-room__loading-hint">{{ loadingHint }}</p>
        </div>
      </div>

      <div v-if="isPublishing" class="live-room__overlay">
        <div class="live-room__top">
          <div class="live-room__title-wrap">
            <span class="live-room__badge">LIVE</span>
            <h2 class="live-room__title">{{ liveTitle || '直播间' }}</h2>
          </div>
          <span class="live-room__status">{{ statusText }}</span>
        </div>
        <div v-if="networkHint" class="live-room__network-hint" :class="networkHintClass">
          {{ networkHint }}
        </div>

        <div class="live-room__bottom">
          <el-button
            circle
            :type="micEnabled ? 'default' : 'danger'"
            :disabled="!isPublishing"
            :title="micEnabled ? '静音' : '开麦'"
            @click="toggleMic"
          >
            <el-icon><Microphone v-if="micEnabled" /><Mute v-else /></el-icon>
          </el-button>
          <el-button
            circle
            :type="cameraEnabled ? 'default' : 'danger'"
            :disabled="!isPublishing || isScreenSharing"
            :title="isScreenSharing ? '屏幕共享中无法切换摄像头' : cameraEnabled ? '关摄像头' : '开摄像头'"
            @click="toggleCamera"
          >
            <el-icon><VideoCamera v-if="cameraEnabled" /><VideoPause v-else /></el-icon>
          </el-button>
          <el-button
            circle
            :type="isScreenSharing ? 'primary' : 'default'"
            :disabled="!isPublishing"
            :loading="screenShareLoading"
            :title="isScreenSharing ? '结束屏幕共享' : '共享屏幕'"
            @click="toggleScreenShareAction"
          >
            <el-icon><Monitor /></el-icon>
          </el-button>
          <el-button
            circle
            :type="shareSystemAudioEnabled ? 'primary' : 'default'"
            :disabled="!isPublishing"
            :loading="systemAudioLoading"
            :title="systemAudioButtonTitle"
            @click="toggleSystemAudioAction"
          >
            <el-icon><Headset /></el-icon>
          </el-button>
          <el-button
            circle
            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <el-icon><FullScreen v-if="!isFullscreen" /><ScaleToOriginal v-else /></el-icon>
          </el-button>
          <el-button
            type="danger"
            round
            :loading="finishing"
            @click="handleFinish"
          >
            结束直播
          </el-button>
        </div>
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="live-room__alert"
    >
      <template #default>
        <el-button type="primary" link @click="retryBroadcast">重试</el-button>
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FullScreen,
  Headset,
  Loading,
  Microphone,
  Monitor,
  Mute,
  ScaleToOriginal,
  VideoCamera,
  VideoPause,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  useAgoraBroadcaster,
  type BroadcastLoadingStep,
} from '@/composables/useAgoraBroadcaster'
import { useFullscreen } from '@/composables/useFullscreen'
import { getApiErrorMessage, liveApi } from '@/utils/api'
import type { Live } from '@/utils/mockData'

const route = useRoute()
const router = useRouter()
const liveId = computed(() => Number(route.params.id))
const routeLive = (history.state?.live as Live | undefined) ?? undefined

const stageRef = ref<HTMLDivElement>()
const localVideoRef = ref<HTMLDivElement>()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(stageRef)

const liveTitle = ref('')
const isPublishing = ref(false)
const isLoading = ref(true)
const loadingStep = ref<'init' | BroadcastLoadingStep | 'done'>('init')
const finishing = ref(false)
const errorMessage = ref('')
const micEnabled = ref(true)
const cameraEnabled = ref(true)
const screenShareLoading = ref(false)
const systemAudioLoading = ref(false)

const {
  isScreenSharing,
  shareSystemAudioEnabled,
  isSystemAudioActive,
  networkQuality,
  connectionState,
  reconnectAttempts,
  reconnectMaxAttempts,
  joinAsHost,
  leave,
  setMicEnabled,
  setCameraEnabled,
  toggleScreenShare,
  toggleSystemAudioSharing,
} = useAgoraBroadcaster()

const statusText = computed(() => {
  if (connectionState.value === 'reconnecting') return '重连中'
  if (connectionState.value === 'disconnected' && isPublishing.value) return '连接已断开'
  if (isScreenSharing.value && isSystemAudioActive.value) return '屏幕共享中 · 含系统音频'
  if (isScreenSharing.value) return '屏幕共享中'
  if (shareSystemAudioEnabled.value && !isScreenSharing.value) return '推流中 · 下次共享将采集系统音频'
  return isPublishing.value ? '推流中' : '正在连接…'
})

const networkHint = computed(() => {
  if (!isPublishing.value) return ''
  if (connectionState.value === 'reconnecting') {
    const count = Math.min(reconnectAttempts.value, reconnectMaxAttempts)
    return `网络波动，正在自动重连（${count}/${reconnectMaxAttempts}）…`
  }
  if (connectionState.value === 'disconnected') return '连接中断，请检查网络后重试'
  if (networkQuality.value === 'poor' || networkQuality.value === 'down') {
    return '当前网络较差，已自动降低码率并启用音频优先保护'
  }
  if (networkQuality.value === 'fair') return '当前网络一般，画质可能临时下降'
  return ''
})

const networkHintClass = computed(() => {
  if (connectionState.value === 'reconnecting') return 'live-room__network-hint--warn'
  if (connectionState.value === 'disconnected') return 'live-room__network-hint--danger'
  if (networkQuality.value === 'poor' || networkQuality.value === 'down') {
    return 'live-room__network-hint--warn'
  }
  return 'live-room__network-hint--info'
})

const systemAudioButtonTitle = computed(() => {
  if (!isPublishing.value) return '共享系统音频'
  if (!isScreenSharing.value) {
    return shareSystemAudioEnabled.value
      ? '已开启：下次共享屏幕时将采集系统音频'
      : '已关闭：下次共享屏幕时不采集系统音频'
  }
  if (shareSystemAudioEnabled.value && isSystemAudioActive.value) {
    return '关闭系统音频（麦克风仍保留）'
  }
  if (shareSystemAudioEnabled.value && !isSystemAudioActive.value) {
    return '开启系统音频（若未采集到将重新弹出共享窗口，请勾选共享音频）'
  }
  return '开启系统音频'
})

const loadingTitle = computed(() => {
  const map: Record<string, string> = {
    init: '正在准备直播间',
    camera: '正在获取摄像头和麦克风',
    preview: '正在启动本地预览',
    join: '正在连接直播频道',
    publish: '正在发布音视频流',
    done: '连接成功',
  }
  return map[loadingStep.value] ?? '正在连接…'
})

const loadingHint = computed(() => {
  if (loadingStep.value === 'camera') {
    return '请在浏览器弹窗中允许使用摄像头和麦克风'
  }
  if (loadingStep.value === 'join' || loadingStep.value === 'publish') {
    return '请保持网络畅通，首次连接可能需要几秒钟'
  }
  return '马上就好，请稍候'
})

const startBroadcast = async () => {
  if (!localVideoRef.value) return

  await leave()

  isLoading.value = true
  loadingStep.value = 'init'
  errorMessage.value = ''
  isPublishing.value = false

  try {
    let detail: Live | null = routeLive?.id === liveId.value ? routeLive : null
    if (!detail) {
      try {
        detail = await liveApi.getLiveById(liveId.value)
      } catch (error: unknown) {
        console.warn('getLiveById failed, continue with rtc-token', error)
      }
    }

    if (detail) {
      liveTitle.value = detail.title
      if (detail.status === 'ended' || detail.status === 'offline') {
        throw new Error('直播已结束或已下架')
      }
      if (!['published', 'live'].includes(detail.status)) {
        throw new Error(`当前状态不可推流（${getStatusText(detail.status)}）`)
      }
      if (detail.status === 'published') {
        await liveApi.startLive(liveId.value)
      }
    } else {
      liveTitle.value = `直播 #${liveId.value}`
    }

    const cred = await liveApi.getAgoraRtcToken(liveId.value)
    if (cred.role !== 'publisher') {
      throw new Error('当前账号无推流权限，请使用本场直播的志愿者账号')
    }

    await joinAsHost(cred, localVideoRef.value, (step) => {
      loadingStep.value = step
    })

    loadingStep.value = 'done'
    isPublishing.value = true
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, '进入直播间失败')
    ElMessage.error(errorMessage.value)
    await leave()
  } finally {
    isLoading.value = false
  }
}

const retryBroadcast = () => {
  void nextTick(() => startBroadcast())
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
    offline: '已下架',
  }
  return map[status] || status
}

const toggleMic = async () => {
  micEnabled.value = !micEnabled.value
  await setMicEnabled(micEnabled.value)
}

const toggleCamera = async () => {
  if (isScreenSharing.value) return
  cameraEnabled.value = !cameraEnabled.value
  await setCameraEnabled(cameraEnabled.value)
}

const toggleScreenShareAction = async () => {
  if (!localVideoRef.value || screenShareLoading.value) return

  screenShareLoading.value = true
  try {
    await toggleScreenShare(localVideoRef.value)
    if (isScreenSharing.value) {
      if (shareSystemAudioEnabled.value && isSystemAudioActive.value) {
        ElMessage.success('已开始共享屏幕和系统音频')
      } else if (shareSystemAudioEnabled.value) {
        ElMessage.warning('屏幕共享已开始，但未采集到系统音频，请重新共享并勾选“共享音频”')
      } else {
        ElMessage.success('已开始共享屏幕，观众将看到你的屏幕内容')
      }
    } else {
      ElMessage.success('已结束屏幕共享，恢复摄像头画面')
    }
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '屏幕共享失败'))
  } finally {
    screenShareLoading.value = false
  }
}

const toggleSystemAudioAction = async () => {
  if (!isPublishing.value || systemAudioLoading.value) return

  systemAudioLoading.value = true
  try {
    const wasEnabled = shareSystemAudioEnabled.value
    await toggleSystemAudioSharing(localVideoRef.value)

    if (!isScreenSharing.value) {
      ElMessage.success(
        shareSystemAudioEnabled.value
          ? '已开启：下次共享屏幕时将尝试采集系统音频'
          : '已关闭：共享屏幕时不再采集系统音频'
      )
      return
    }

    if (shareSystemAudioEnabled.value && isSystemAudioActive.value) {
      ElMessage.success('系统音频已开启，观众可听到屏幕声音')
      return
    }

    if (!wasEnabled && shareSystemAudioEnabled.value && !isSystemAudioActive.value) {
      ElMessage.warning('未采集到系统音频，请在浏览器弹窗中勾选“共享音频”后重试')
      return
    }

    ElMessage.success('系统音频已关闭，麦克风讲解仍保留')
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '系统音频切换失败'))
  } finally {
    systemAudioLoading.value = false
  }
}

const handleFinish = async () => {
  try {
    await ElMessageBox.confirm('确定结束本场直播吗？', '结束直播', {
      type: 'warning',
      confirmButtonText: '结束',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  finishing.value = true
  try {
    await liveApi.finishLive(liveId.value)
    await leave()
    ElMessage.success('直播已结束')
    router.replace('/volunteer/live')
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '结束直播失败'))
  } finally {
    finishing.value = false
  }
}

onMounted(() => {
  void nextTick(() => startBroadcast())
})

onUnmounted(() => {
  void leave()
})
</script>

<style scoped lang="scss">
.live-room {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: calc(100vh - 120px);

  &__stage {
    position: relative;
    width: 100%;
    height: min(78vh, 760px);
    min-height: 480px;
    border-radius: 12px;
    overflow: hidden;
    background: #0a0a0a;

    &--fullscreen {
      width: 100vw;
      height: 100vh;
      min-height: 100vh;
      border-radius: 0;
    }
  }

  &__video {
    position: absolute;
    inset: 0;

    :deep(video) {
      width: 100% !important;
      height: 100% !important;
      background: #000;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(4px);
  }

  &__loading-card {
    text-align: center;
    color: #fff;
    padding: 24px 32px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
  }

  &__loading-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  &__loading-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }

  &__loading-hint {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.72);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.55) 0%,
      transparent 28%,
      transparent 72%,
      rgba(0, 0, 0, 0.65) 100%
    );
  }

  &__top,
  &__network-hint,
  &__bottom {
    pointer-events: auto;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    color: #fff;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f56c6c;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status {
    flex-shrink: 0;
    font-size: 13px;
    color: #95d475;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 20px 20px;
  }

  &__network-hint {
    margin: 0 20px;
    align-self: center;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1.3;
    color: #fff;
    background: rgba(64, 158, 255, 0.78);
  }

  &__network-hint--info {
    background: rgba(64, 158, 255, 0.78);
  }

  &__network-hint--warn {
    background: rgba(230, 162, 60, 0.86);
  }

  &__network-hint--danger {
    background: rgba(245, 108, 108, 0.86);
  }

  &__alert {
    margin-top: 4px;
  }
}

:global(:fullscreen) .live-room__stage {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  border-radius: 0;
}
</style>

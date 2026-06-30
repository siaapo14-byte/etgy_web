<template>
  <div class="live-room">
    <div class="live-room__header">
      <div>
        <h2>{{ liveTitle || '直播间' }}</h2>
        <p class="live-room__status">{{ statusText }}</p>
      </div>
      <div class="live-room__actions">
        <el-button :disabled="!isPublishing" @click="toggleMic">
          {{ micEnabled ? '静音' : '开麦' }}
        </el-button>
        <el-button :disabled="!isPublishing" @click="toggleCamera">
          {{ cameraEnabled ? '关摄像头' : '开摄像头' }}
        </el-button>
        <el-button type="danger" :loading="finishing" @click="handleFinish">
          结束直播
        </el-button>
      </div>
    </div>

    <div ref="localVideoRef" class="live-room__video" />

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="live-room__alert"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAgoraBroadcaster } from '@/composables/useAgoraBroadcaster'
import { getApiErrorMessage, liveApi } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const liveId = computed(() => Number(route.params.id))

const localVideoRef = ref<HTMLDivElement>()
const liveTitle = ref('')
const isPublishing = ref(false)
const finishing = ref(false)
const errorMessage = ref('')
const micEnabled = ref(true)
const cameraEnabled = ref(true)

const { joinAsHost, leave, setMicEnabled, setCameraEnabled } = useAgoraBroadcaster()

const statusText = computed(() => (isPublishing.value ? '推流中' : '正在连接…'))

const startBroadcast = async () => {
  if (!localVideoRef.value) return

  try {
    const detail = await liveApi.getLiveById(liveId.value)
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

    const cred = await liveApi.getAgoraRtcToken(liveId.value)
    if (cred.role !== 'publisher') {
      throw new Error('当前账号无推流权限，请使用本场直播的志愿者账号')
    }

    await joinAsHost(cred, localVideoRef.value)
    isPublishing.value = true
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, '进入直播间失败')
    ElMessage.error(errorMessage.value)
  }
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
  cameraEnabled.value = !cameraEnabled.value
  await setCameraEnabled(cameraEnabled.value)
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
  void startBroadcast()
})

onUnmounted(() => {
  void leave()
})
</script>

<style scoped lang="scss">
.live-room {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 120px);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  &__status {
    margin: 6px 0 0;
    color: #67c23a;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__video {
    flex: 1;
    min-height: 480px;
    border-radius: 12px;
    overflow: hidden;
    background: #111;
  }

  &__alert {
    margin-top: 8px;
  }
}
</style>

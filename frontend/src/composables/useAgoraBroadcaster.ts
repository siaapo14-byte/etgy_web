import { ref } from 'vue'
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type ILocalAudioTrack,
  type ILocalVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'

export interface AgoraRtcCredentials {
  appId: string
  channelName: string
  uid: number
  token: string
}

export type BroadcastLoadingStep =
  | 'camera'
  | 'preview'
  | 'join'
  | 'publish'

type VideoPreviewOptions = {
  fit?: 'cover' | 'contain'
  mirror?: boolean
}

const SCREEN_SHARE_CONFIG = {
  encoderConfig: {
    width: 1920,
    height: 1080,
    frameRate: 15,
    bitrateMin: 1500,
    bitrateMax: 3000,
  },
  optimizationMode: 'detail' as const,
}

export function useAgoraBroadcaster() {
  const isScreenSharing = ref(false)
  const shareSystemAudioEnabled = ref(false)
  const isSystemAudioActive = ref(false)

  let client: IAgoraRTCClient | null = null
  let localAudioTrack: IMicrophoneAudioTrack | null = null
  let localVideoTrack: ICameraVideoTrack | null = null
  let localScreenTrack: ILocalVideoTrack | null = null
  let localScreenAudioTrack: ILocalAudioTrack | null = null
  let previewElement: HTMLElement | null = null

  async function playPreview(
    videoEl: HTMLElement,
    track: ILocalVideoTrack,
    options: VideoPreviewOptions = {}
  ) {
    const { fit = 'cover', mirror = false } = options
    await track.play(videoEl, { fit, mirror })
  }

  async function createScreenTracks(withSystemAudio: boolean) {
    const audioMode = withSystemAudio ? 'auto' : 'disable'
    const result = await AgoraRTC.createScreenVideoTrack(
      SCREEN_SHARE_CONFIG,
      audioMode
    )

    if (Array.isArray(result)) {
      return { screenTrack: result[0], screenAudioTrack: result[1] }
    }

    return { screenTrack: result, screenAudioTrack: null }
  }

  async function publishScreenAudioTrack() {
    if (!client || !localScreenAudioTrack || !shareSystemAudioEnabled.value) {
      isSystemAudioActive.value = false
      return
    }

    await localScreenAudioTrack.setEnabled(true)
    await client.publish(localScreenAudioTrack)
    isSystemAudioActive.value = true
  }

  async function unpublishScreenAudioTrack() {
    if (!client || !localScreenAudioTrack) {
      isSystemAudioActive.value = false
      return
    }

    await localScreenAudioTrack.setEnabled(false)
    try {
      await client.unpublish(localScreenAudioTrack)
    } catch {
      // 可能已取消发布
    }
    isSystemAudioActive.value = false
  }

  async function cleanupScreenTracks() {
    await unpublishScreenAudioTrack()

    if (localScreenAudioTrack) {
      localScreenAudioTrack.close()
      localScreenAudioTrack = null
    }

    const screenTrack = localScreenTrack
    if (screenTrack) {
      screenTrack.stop()
      try {
        await client?.unpublish(screenTrack)
      } catch {
        // track-ended 时可能已自动取消发布
      }
      screenTrack.close()
      localScreenTrack = null
    }

    isScreenSharing.value = false
    isSystemAudioActive.value = false
  }

  async function joinAsHost(
    cred: AgoraRtcCredentials,
    videoEl: HTMLElement,
    onStep?: (step: BroadcastLoadingStep) => void
  ) {
    if (!videoEl.clientWidth || !videoEl.clientHeight) {
      throw new Error('视频容器尚未就绪，请刷新页面后重试')
    }

    previewElement = videoEl
    onStep?.('camera')

    let tracks: [IMicrophoneAudioTrack, ICameraVideoTrack]
    try {
      tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          ANS: true,
          AEC: true,
        },
        {
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrateMin: 1000,
            bitrateMax: 2500,
          },
          optimizationMode: 'motion',
        }
      )
    } catch {
      throw new Error('无法访问摄像头或麦克风，请检查浏览器权限设置')
    }

    localAudioTrack = tracks[0]
    localVideoTrack = tracks[1]
    isScreenSharing.value = false
    isSystemAudioActive.value = false

    onStep?.('preview')
    await playPreview(videoEl, localVideoTrack, { fit: 'cover', mirror: true })

    client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' })
    await client.setClientRole('host')

    onStep?.('join')
    await client.join(cred.appId, cred.channelName, cred.token, cred.uid)

    onStep?.('publish')
    await client.publish(tracks)

    if (!localVideoTrack.isPlaying) {
      throw new Error('摄像头预览未启动，请确认浏览器已授权并关闭占用摄像头的其他应用')
    }
  }

  async function startScreenShare(videoEl: HTMLElement) {
    if (!client || !localVideoTrack) {
      throw new Error('请先完成直播连接后再共享屏幕')
    }
    if (isScreenSharing.value) return

    let screenTrack: ILocalVideoTrack
    let screenAudioTrack: ILocalAudioTrack | null = null

    try {
      const tracks = await createScreenTracks(shareSystemAudioEnabled.value)
      screenTrack = tracks.screenTrack
      screenAudioTrack = tracks.screenAudioTrack
    } catch {
      throw new Error('未选择共享内容或屏幕共享权限被拒绝')
    }

    previewElement = videoEl
    localScreenAudioTrack = screenAudioTrack

    screenTrack.on('track-ended', () => {
      void restoreCameraPreview()
    })

    localVideoTrack.stop()
    await client.unpublish(localVideoTrack)

    await playPreview(videoEl, screenTrack, { fit: 'contain' })
    await client.publish(screenTrack)
    await publishScreenAudioTrack()

    localScreenTrack = screenTrack
    isScreenSharing.value = true
  }

  async function restoreCameraPreview() {
    if (!isScreenSharing.value && !localScreenTrack) return

    const videoEl = previewElement
    const cameraTrack = localVideoTrack

    if (!client || !videoEl || !cameraTrack) {
      await cleanupScreenTracks()
      return
    }

    await cleanupScreenTracks()
    await playPreview(videoEl, cameraTrack, { fit: 'cover', mirror: true })
    await client.publish(cameraTrack)
  }

  async function restartScreenShare(videoEl: HTMLElement) {
    const withSystemAudio = shareSystemAudioEnabled.value
    await restoreCameraPreview()
    shareSystemAudioEnabled.value = withSystemAudio
    await startScreenShare(videoEl)
  }

  async function stopScreenShare() {
    if (!isScreenSharing.value) return
    await restoreCameraPreview()
  }

  async function toggleScreenShare(videoEl: HTMLElement) {
    if (isScreenSharing.value) {
      await stopScreenShare()
      return
    }
    await startScreenShare(videoEl)
  }

  async function setSystemAudioSharing(enabled: boolean) {
    shareSystemAudioEnabled.value = enabled

    if (!isScreenSharing.value) return

    const videoEl = previewElement
    if (!videoEl) return

    if (!localScreenAudioTrack) {
      if (!enabled) return
      await restartScreenShare(videoEl)
      if (!localScreenAudioTrack) {
        throw new Error('未采集到系统音频，请在浏览器共享弹窗中勾选“共享音频”或“Share tab audio”')
      }
      return
    }

    if (enabled) {
      await publishScreenAudioTrack()
      return
    }

    await unpublishScreenAudioTrack()
  }

  async function toggleSystemAudioSharing(videoEl?: HTMLElement) {
    const next = !shareSystemAudioEnabled.value

    if (!isScreenSharing.value) {
      shareSystemAudioEnabled.value = next
      isSystemAudioActive.value = false
      return
    }

    if (!videoEl) {
      throw new Error('视频容器尚未就绪')
    }

    await setSystemAudioSharing(next)
  }

  async function leave() {
    await cleanupScreenTracks()

    localAudioTrack?.close()
    localVideoTrack?.close()
    localAudioTrack = null
    localVideoTrack = null
    previewElement = null
    shareSystemAudioEnabled.value = false

    if (client) {
      client.removeAllListeners()
      await client.leave()
      client = null
    }
  }

  async function setMicEnabled(enabled: boolean) {
    await localAudioTrack?.setEnabled(enabled)
  }

  async function setCameraEnabled(enabled: boolean) {
    if (isScreenSharing.value) return
    await localVideoTrack?.setEnabled(enabled)
  }

  return {
    isScreenSharing,
    shareSystemAudioEnabled,
    isSystemAudioActive,
    joinAsHost,
    leave,
    setMicEnabled,
    setCameraEnabled,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    setSystemAudioSharing,
    toggleSystemAudioSharing,
  }
}

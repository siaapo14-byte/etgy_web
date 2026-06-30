import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'

export interface AgoraRtcCredentials {
  appId: string
  channelName: string
  uid: number
  token: string
}

export function useAgoraBroadcaster() {
  let client: IAgoraRTCClient | null = null
  let localAudioTrack: IMicrophoneAudioTrack | null = null
  let localVideoTrack: ICameraVideoTrack | null = null

  async function joinAsHost(cred: AgoraRtcCredentials, videoEl: HTMLElement) {
    if (!videoEl.clientWidth || !videoEl.clientHeight) {
      throw new Error('视频容器尚未就绪，请刷新页面后重试')
    }

    let tracks: [IMicrophoneAudioTrack, ICameraVideoTrack]
    try {
      tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 15,
            bitrateMin: 600,
            bitrateMax: 1500,
          },
        }
      )
    } catch {
      throw new Error('无法访问摄像头或麦克风，请检查浏览器权限设置')
    }

    localAudioTrack = tracks[0]
    localVideoTrack = tracks[1]

    // 先本地预览，再 join + publish（与声网官方 live 示例一致）
    await localVideoTrack.play(videoEl, { fit: 'cover', mirror: true })

    client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
    await client.setClientRole('host')
    await client.join(cred.appId, cred.channelName, cred.token, cred.uid)
    await client.publish(tracks)

    if (!localVideoTrack.isPlaying) {
      throw new Error('摄像头预览未启动，请确认浏览器已授权并关闭占用摄像头的其他应用')
    }
  }

  async function leave() {
    localAudioTrack?.close()
    localVideoTrack?.close()
    localAudioTrack = null
    localVideoTrack = null

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
    await localVideoTrack?.setEnabled(enabled)
  }

  return { joinAsHost, leave, setMicEnabled, setCameraEnabled }
}

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
    client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
    await client.setClientRole('host')
    await client.join(cred.appId, cred.channelName, cred.token, cred.uid)

    let tracks: [IMicrophoneAudioTrack, ICameraVideoTrack]
    try {
      tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    } catch {
      throw new Error('无法访问摄像头或麦克风，请检查浏览器权限设置')
    }

    localAudioTrack = tracks[0]
    localVideoTrack = tracks[1]
    localVideoTrack.play(videoEl)
    await client.publish(tracks)
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

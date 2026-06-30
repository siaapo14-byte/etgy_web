import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useFullscreen(targetRef: Ref<HTMLElement | undefined>) {
  const isFullscreen = ref(false)

  const syncState = () => {
    isFullscreen.value = document.fullscreenElement === targetRef.value
  }

  const enter = async () => {
    const el = targetRef.value
    if (!el || isFullscreen.value) return
    await el.requestFullscreen()
  }

  const exit = async () => {
    if (!document.fullscreenElement) return
    await document.exitFullscreen()
  }

  const toggle = async () => {
    if (isFullscreen.value) {
      await exit()
    } else {
      await enter()
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', syncState)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', syncState)
    if (document.fullscreenElement === targetRef.value) {
      void document.exitFullscreen()
    }
  })

  return { isFullscreen, enter, exit, toggle }
}

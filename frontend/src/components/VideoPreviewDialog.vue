<template>
  <el-dialog
    :model-value="modelValue"
    title="详情信息"
    width="1100px"
    class="video-preview-dialog"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="handleClosed"
  >
    <div v-if="video" class="vpd">
      <aside class="vpd__side">
        <div class="vpd__nav">
          <button
            class="vpd__navItem"
            :class="{ 'is-active': active === 'cover' }"
            type="button"
            @click="active = 'cover'"
          >
            <el-icon class="vpd__navIcon"><Picture /></el-icon>
            <span>封面</span>
          </button>
          <button
            class="vpd__navItem"
            :class="{ 'is-active': active === 'video' }"
            type="button"
            @click="active = 'video'"
          >
            <el-icon class="vpd__navIcon"><VideoPlay /></el-icon>
            <span>视频</span>
          </button>
          <button
            class="vpd__navItem"
            :class="{ 'is-active': active === 'info' }"
            type="button"
            @click="active = 'info'"
          >
            <el-icon class="vpd__navIcon"><InfoFilled /></el-icon>
            <span>信息</span>
          </button>
          <button
            class="vpd__navItem"
            :class="{ 'is-active': active === 'comments' }"
            type="button"
            @click="active = 'comments'"
          >
            <el-icon class="vpd__navIcon"><ChatDotRound /></el-icon>
            <span>视频评论</span>
          </button>
        </div>
      </aside>

      <main class="vpd__main">
        <!-- Cover -->
        <section v-if="active === 'cover'" class="vpd__panel">
          <div class="vpd__media">
            <img v-if="coverSrc" class="vpd__img" :src="coverSrc" alt="视频封面" />
            <div v-else class="vpd__empty">
              <el-icon class="vpd__emptyIcon"><Picture /></el-icon>
              <div class="vpd__emptyText">{{ mediaLoadError ? '封面加载失败' : (mediaLoading ? '加载中…' : '暂无封面') }}</div>
              <div v-if="mediaLoadError" class="vpd__emptySub">{{ mediaLoadError }}</div>
            </div>
          </div>
        </section>

        <!-- Video -->
        <section v-else-if="active === 'video'" class="vpd__panel">
          <div class="vpd__media vpd__media--dark">
            <div v-if="videoSrc" class="vpd__videoWrap">
              <video
                ref="videoEl"
                class="vpd__video"
                :src="videoSrc"
                controls
                preload="metadata"
                @error="handleVideoError"
                @loadedmetadata="handleLoadedMeta"
                @canplay="handleCanPlay"
              />

              <!-- 播放失败时给出可定位的错误信息（不影响正常用户观看） -->
              <div v-if="videoError" class="vpd__videoError">
                <div class="vpd__videoErrorTitle">视频加载失败</div>
                <div class="vpd__videoErrorRow">URL：{{ videoSrc }}</div>
                <div class="vpd__videoErrorRow">错误：{{ videoError }}</div>
                <div class="vpd__videoErrorHint">
                  常见原因：URL 需要鉴权/已过期、OSS/后端未允许跨域、Nginx/后端返回 401/403/404、视频编码浏览器不支持。
                </div>
              </div>
            </div>
            <div v-else class="vpd__empty">
              <el-icon class="vpd__emptyIcon"><VideoPlay /></el-icon>
              <div class="vpd__emptyText">{{ mediaLoadError ? '视频加载失败' : (mediaLoading ? '加载中…' : '视频文件待上传') }}</div>
              <div v-if="mediaLoadError" class="vpd__emptySub">{{ mediaLoadError }}</div>
            </div>
          </div>
        </section>

        <!-- Info -->
        <section v-else-if="active === 'info'" class="vpd__panel vpd__panel--scroll">
          <div class="vpd__fieldGrid">
            <div class="vpd__field">
              <div class="vpd__label">标题</div>
              <div class="vpd__value vpd__value--strong">{{ video.title || '-' }}</div>
            </div>
            <div class="vpd__field">
              <div class="vpd__label">简介</div>
              <div class="vpd__value">{{ video.description || '-' }}</div>
            </div>

            <div class="vpd__field">
              <div class="vpd__label">志愿者</div>
              <div class="vpd__value">{{ video.volunteerName || '-' }}</div>
            </div>
            <div class="vpd__field">
              <div class="vpd__label">学院</div>
              <div class="vpd__value">{{ video.collegeName || '-' }}</div>
            </div>

            <div class="vpd__field">
              <div class="vpd__label">学科</div>
              <div class="vpd__value">{{ video.subject || '-' }}</div>
            </div>
            <div class="vpd__field">
              <div class="vpd__label">年级</div>
              <div class="vpd__value">
                <template v-if="Array.isArray(video.grade) && video.grade.length">
                  <el-tag v-for="g in video.grade" :key="g" class="vpd__tag" size="small">{{ g }}</el-tag>
                </template>
                <span v-else>-</span>
              </div>
            </div>

            <div class="vpd__field vpd__field--full">
              <div class="vpd__label">状态</div>
              <div class="vpd__value">
                <el-tag :type="statusType(video.status)" effect="light" class="vpd__statusTag">
                  {{ statusText(video.status) }}
                </el-tag>
              </div>
            </div>

            <div class="vpd__statRow vpd__field--full">
              <div class="vpd__stat">
                <div class="vpd__statLabel">播放量</div>
                <div class="vpd__statValue">{{ video.playCount ?? 0 }}</div>
              </div>
              <div class="vpd__stat">
                <div class="vpd__statLabel">点赞数</div>
                <div class="vpd__statValue">{{ video.likeCount ?? 0 }}</div>
              </div>
              <div class="vpd__stat">
                <div class="vpd__statLabel">收藏数</div>
                <div class="vpd__statValue">{{ video.collectCount ?? 0 }}</div>
              </div>
            </div>

            <div class="vpd__field vpd__field--full">
              <div class="vpd__label">创建时间</div>
              <div class="vpd__value">{{ formatDate(video.createdAt) }}</div>
            </div>
          </div>
        </section>

        <!-- Comments -->
        <section v-else class="vpd__panel vpd__panel--scroll">
          <div class="vpd__commentsHeader">
            <div>
              <div class="vpd__commentsTitle">视频评论</div>
              <div v-if="comments.length" class="vpd__commentsHint">可在右侧操作列删除评论</div>
            </div>
            <el-button size="small" :loading="commentsLoading" @click="loadComments(true)">刷新</el-button>
          </div>

          <div class="vpd__commentsTableWrap">
            <el-table
              v-loading="commentsLoading"
              :data="comments"
              size="small"
              style="width: 100%"
              empty-text="暂无评论"
            >
              <el-table-column prop="content" label="评论内容" min-width="200">
                <template #default="{ row }">
                  <div class="vpd__commentContent">{{ row.content }}</div>
                  <div v-if="row.rejectReason" class="vpd__commentReject">驳回：{{ row.rejectReason }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="authorName" label="发布者" width="100" />
              <el-table-column prop="status" label="状态" width="88">
                <template #default="{ row }">
                  <el-tag :type="commentStatusType(row.status)" size="small">{{ commentStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="时间" width="150">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    :loading="deletingCommentId === row.id"
                    @click.stop="handleDeleteComment(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="commentsTotal > comments.length" class="vpd__commentsMore">
            共 {{ commentsTotal }} 条，当前展示 {{ comments.length }} 条
          </div>
        </section>
      </main>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, VideoPlay, InfoFilled, ChatDotRound } from '@element-plus/icons-vue'
import { VideosApiFp } from '@/api-services/apis/videos-api'
import { apiConfig } from '@/apiClient'
import { commentApi, getApiErrorMessage } from '@/utils/api'

const props = defineProps<{
  modelValue: boolean
  video: any | null
  /**
   * 是否为“我的视频”场景：true 时使用 /api/videos/mine/{id}/media-urls
   * false/不传时使用公开接口 /api/videos/{id}/media-urls
   */
  isMine?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const active = ref<'cover' | 'video' | 'info' | 'comments'>('info')
const videoEl = ref<HTMLVideoElement | null>(null)
const videoError = ref('')
const videoSrc = ref('')
const coverSrc = ref('')
const mediaLoading = ref(false)
const mediaLoadError = ref('')
const lastVideoId = ref<number | null>(null)

const comments = ref<any[]>([])
const commentsTotal = ref(0)
const commentsLoading = ref(false)
const commentsLoadedForId = ref<number | null>(null)
const deletingCommentId = ref<number | null>(null)

const pickMediaUrl = (data: any, keys: string[]): string => {
  for (const k of keys) {
    const v = data?.[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

const loadMediaUrls = async (id: number) => {
  if (!id) return
  if (mediaLoading.value) return
  // 已加载过就不重复请求
  if (lastVideoId.value === id && (videoSrc.value || coverSrc.value)) return

  mediaLoading.value = true
  mediaLoadError.value = ''
  try {
    const req = props.isMine
      ? await VideosApiFp(apiConfig).apiVideosMineIdMediaUrlsGet(String(id))
      : await VideosApiFp(apiConfig).apiVideosIdMediaUrlsGet(String(id))
    const res = await req()
    const data: any = res.data.data || {}
    // 返回结构未强类型化，这里做多字段兼容
    videoSrc.value = pickMediaUrl(data, ['videoUrl', 'video', 'url', 'videoPresignedUrl', 'videoSignedUrl'])
    coverSrc.value = pickMediaUrl(data, ['coverUrl', 'cover', 'coverPresignedUrl', 'coverSignedUrl', 'imageUrl'])
    lastVideoId.value = id
  } catch (e: any) {
    const detail =
      e?.response?.data
        ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
        : ''
    mediaLoadError.value = (e?.message || '获取预签名播放地址失败') + (detail ? `（后端返回：${detail}）` : '')
  } finally {
    mediaLoading.value = false
  }
}

watch(
  () => [props.modelValue, props.video?.id, active.value],
  ([visible, vid, tab]) => {
    if (!visible) return
    // 切换 tab 或切换视频时：重置错误提示 & 按需加载预签名 URL
    videoError.value = ''
    mediaLoadError.value = ''

    const id = Number(vid)
    if (Number.isFinite(id) && id > 0 && lastVideoId.value !== id) {
      videoSrc.value = ''
      coverSrc.value = ''
      lastVideoId.value = null
      comments.value = []
      commentsTotal.value = 0
      commentsLoadedForId.value = null
    }

    if (tab === 'video' || tab === 'cover') {
      // 只有访问媒体 tab 时才请求
      void loadMediaUrls(id)
    }

    if (tab === 'comments') {
      void loadComments()
    }
  }
)

const loadComments = async (force = false) => {
  const id = Number(props.video?.id)
  if (!Number.isFinite(id) || id <= 0) return
  if (!force && commentsLoadedForId.value === id && comments.value.length > 0) return

  commentsLoading.value = true
  try {
    const result = await commentApi.getVideoComments(id, { page: 1, pageSize: 50 })
    comments.value = result.items
    commentsTotal.value = result.total
    commentsLoadedForId.value = id
  } catch (e: any) {
    ElMessage.error(e?.message || '加载评论失败')
  } finally {
    commentsLoading.value = false
  }
}

const handleDeleteComment = async (row: any) => {
  const commentId = Number(row?.id)
  if (!Number.isFinite(commentId) || commentId <= 0) {
    ElMessage.error('评论 ID 无效')
    return
  }

  try {
    await ElMessageBox.confirm('确定删除这条评论吗？删除后不可恢复。', '删除评论', { type: 'warning' })
    deletingCommentId.value = commentId
    await commentApi.deleteComment(commentId)
    ElMessage.success('删除成功')
    comments.value = comments.value.filter((c) => Number(c.id) !== commentId)
    commentsTotal.value = Math.max(0, commentsTotal.value - 1)
  } catch (e: any) {
    if (e === 'cancel') return
    ElMessage.error(getApiErrorMessage(e, '删除失败'))
  } finally {
    deletingCommentId.value = null
  }
}

const handleClosed = () => {
  active.value = 'info'
  comments.value = []
  commentsTotal.value = 0
  commentsLoadedForId.value = null
}

const resetVideoError = () => {
  videoError.value = ''
}

const handleLoadedMeta = () => {
  resetVideoError()
}

const handleCanPlay = () => {
  resetVideoError()
}

const handleVideoError = () => {
  const el = videoEl.value
  const err = el?.error
  if (!err) {
    videoError.value = '未知错误（mediaError 为空）'
    return
  }
  // MediaError.code: 1=MEDIA_ERR_ABORTED 2=NETWORK 3=DECODE 4=SRC_NOT_SUPPORTED
  const codeMap: Record<number, string> = {
    1: '用户终止 (MEDIA_ERR_ABORTED)',
    2: '网络错误 (MEDIA_ERR_NETWORK)',
    3: '解码失败 (MEDIA_ERR_DECODE)',
    4: '资源不支持/URL 无效 (MEDIA_ERR_SRC_NOT_SUPPORTED)'
  }
  const codeText = codeMap[err.code] || `code=${err.code}`
  videoError.value = `${codeText}${err.message ? `：${err.message}` : ''}`
}

const statusType = (status: string) => {
  const s = String(status || '').toUpperCase()
  const map: Record<string, any> = {
    DRAFT: 'info',
    REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    PUBLISHED: 'success',
    OFFLINE: 'info'
  }
  return map[s] || 'info'
}

const statusText = (status: string) => {
  const s = String(status || '').toUpperCase()
  const map: Record<string, string> = {
    DRAFT: '草稿',
    REVIEW: '审核中',
    APPROVED: '审核通过',
    REJECTED: '审核驳回',
    PUBLISHED: '已上架',
    OFFLINE: '已下架'
  }
  return map[s] || (status || '-')
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return String(dateStr)
  }
}

const commentStatusType = (status: string) => {
  const map: Record<string, any> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[String(status || '').toUpperCase()] || 'info'
}

const commentStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }
  return map[String(status || '').toUpperCase()] || status || '-'
}
</script>

<style lang="scss">
/* 全局样式：需要覆盖 el-dialog 结构，因此不使用 scoped */
.video-preview-dialog {
  --vpd-radius: 14px;
  --vpd-border: rgba(15, 23, 42, 0.08);
  --vpd-muted: rgba(15, 23, 42, 0.6);
  --vpd-bg: rgba(248, 250, 252, 0.9);
  --vpd-card: rgba(255, 255, 255, 0.92);

  .el-dialog__body {
    padding: 14px 16px 10px;
  }
}

.vpd {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 14px;
  height: 560px;
}

.vpd__side {
  border: 1px solid var(--vpd-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), var(--vpd-bg));
  border-radius: var(--vpd-radius);
  padding: 14px 12px;
}

.vpd__nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vpd__navItem {
  appearance: none;
  border: 1px solid var(--vpd-border);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.8);
  font-size: 14px;
  transition: all 0.18s ease;
}

.vpd__navIcon {
  font-size: 18px;
  color: rgba(15, 23, 42, 0.6);
}

.vpd__navItem:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.vpd__navItem.is-active {
  background: rgba(239, 246, 255, 0.95);
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.vpd__navItem.is-active .vpd__navIcon {
  color: rgba(37, 99, 235, 0.9);
}

.vpd__main {
  border: 1px solid var(--vpd-border);
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--vpd-radius);
  overflow: auto;
}

.vpd__panel {
  height: 100%;
  padding: 14px;
}

.vpd__panel--scroll {
  overflow: auto;
}

.vpd__media {
  height: 100%;
  border-radius: 12px;
  border: 1px solid var(--vpd-border);
  background: rgba(248, 250, 252, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vpd__media--dark {
  background: #0b1020;
}

.vpd__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.vpd__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vpd__empty {
  text-align: center;
  color: rgba(148, 163, 184, 0.95);
}

.vpd__emptyIcon {
  font-size: 56px;
  margin-bottom: 10px;
}

.vpd__emptyText {
  font-size: 13px;
}

.vpd__emptySub {
  margin-top: 8px;
  max-width: 820px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(148, 163, 184, 0.9);
  word-break: break-all;
}

.vpd__fieldGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.vpd__field {
  border: 1px solid var(--vpd-border);
  background: var(--vpd-card);
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 56px;
}

.vpd__field--full {
  grid-column: 1 / -1;
}

.vpd__label {
  font-size: 12px;
  color: var(--vpd-muted);
  margin-bottom: 6px;
}

.vpd__value {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.9);
  word-break: break-word;
}

.vpd__value--strong {
  font-weight: 700;
}

.vpd__tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.vpd__statRow {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.vpd__stat {
  border: 1px solid var(--vpd-border);
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  padding: 10px 12px;
}

.vpd__statLabel {
  font-size: 12px;
  color: var(--vpd-muted);
}

.vpd__statValue {
  font-size: 18px;
  font-weight: 800;
  margin-top: 6px;
  color: rgba(15, 23, 42, 0.92);
}

.vpd__statusTag {
  border-radius: 999px;
  padding: 2px 10px;
}

.vpd__commentsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.vpd__commentsTitle {
  font-size: 15px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.vpd__commentsHint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--vpd-muted);
}

.vpd__commentContent {
  line-height: 1.5;
  word-break: break-word;
}

.vpd__commentReject {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.vpd__commentsMore {
  margin-top: 10px;
  font-size: 12px;
  color: var(--vpd-muted);
  text-align: right;
}

.vpd__commentsTableWrap {
  width: 100%;
  overflow-x: auto;
}
</style>


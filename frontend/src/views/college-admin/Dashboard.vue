<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2>数据概览</h2>
    </div>
    
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalVideos }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.pendingReview }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.approvalRate }}%</div>
            <div class="stat-label">通过率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.liveCount }}</div>
            <div class="stat-label">直播场次</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.activeVolunteers }}</div>
            <div class="stat-label">活跃志愿者</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.publishedVideos }}</div>
            <div class="stat-label">已上架视频</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalPlays }}</div>
            <div class="stat-label">总播放量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 视频状态分布饼图 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>视频状态分布</span>
          </template>
          <v-chart :option="videoStatusPieOption" style="height: 220px" />
        </el-card>
      </el-col>
      
      <!-- 视频上传趋势 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>视频上传趋势</span>
          </template>
          <v-chart :option="videoTrendOption" style="height: 220px" />
        </el-card>
      </el-col>
      
      <!-- 审核通过率趋势 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>审核通过率趋势</span>
          </template>
          <v-chart :option="approvalTrendOption" style="height: 220px" />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 视频和直播概览 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>已上架视频监控</span>
              <el-button type="primary" size="small" @click="$router.push('/college-admin/videos/manage')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="video-overview">
            <div v-for="video in publishedVideos" :key="video.id" class="video-item" @click="handleViewVideo(video)">
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-meta">
                  <span>{{ video.volunteerName }}</span>
                  <span style="margin: 0 10px">|</span>
                  <span>播放量: {{ video.playCount }}</span>
                  <span style="margin: 0 10px">|</span>
                  <span>点赞: {{ video.likeCount }}</span>
                </div>
              </div>
              <el-button type="warning" size="small" @click.stop="handleQuickOffline(video)">
                下线
              </el-button>
            </div>
            <div v-if="publishedVideos.length === 0" class="empty-state">
              <el-empty description="暂无已上架视频" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>直播概览</span>
              <el-button type="primary" size="small" @click="$router.push('/college-admin/live/review')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="live-overview">
            <div v-for="live in liveOverview" :key="live.id" class="live-item">
              <div class="live-info">
                <div class="live-title">{{ live.title }}</div>
                <div class="live-meta">
                  <span>{{ live.volunteerName }}</span>
                  <span style="margin: 0 10px">|</span>
                  <el-tag :type="getLiveStatusType(live.status)" size="small">
                    {{ getLiveStatusText(live.status) }}
                  </el-tag>
                  <span style="margin: 0 10px">|</span>
                  <span>{{ formatDate(live.startTime) }}</span>
                </div>
              </div>
            </div>
            <div v-if="liveOverview.length === 0" class="empty-state">
              <el-empty description="暂无直播" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近审核记录</span>
          </template>
          <el-table :data="recentAudits" style="width: 100%">
            <el-table-column prop="action" label="操作" width="120" />
            <el-table-column prop="resourceType" label="类型" width="100" />
            <el-table-column prop="details" label="详情" />
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>待处理事项</span>
          </template>
          <el-table :data="pendingItems" style="width: 100%">
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="createdAt" label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleReview(row)">
                  审核
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 下线对话框 -->
    <el-dialog
      v-model="offlineDialogVisible"
      title="下线视频"
      width="500px"
    >
      <el-form :model="offlineForm">
        <el-form-item label="视频标题">
          <div>{{ currentOfflineVideo?.title }}</div>
        </el-form-item>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { videoApi, liveApi, auditApi } from '@/utils/api'
import type { Video, Live, AuditLog } from '@/utils/mockData'
import type { EChartsOption } from 'echarts'
import { PlatformApiFp } from '@/api-services/apis/platform-api'
import { apiConfig } from '@/apiClient'

const router = useRouter()

const videos = ref<Video[]>([])
const lives = ref<Live[]>([])
const auditLogs = ref<AuditLog[]>([])

type DashboardData = {
  scope?: { collegeId?: number }
  totals?: {
    videoTotal?: number
    liveTotal?: number
    volunteerActiveCount?: number
  }
  today?: {
    newVideos?: number
    newLives?: number
  }
  video?: {
    byStatus?: Record<string, number>
    pendingReview?: number
    approved?: number
    published?: number
  }
  live?: {
    byStatus?: Record<string, number>
    pendingReview?: number
    passed?: number
    published?: number
    living?: number
  }
}

const dashboard = ref<DashboardData | null>(null)

const offlineDialogVisible = ref(false)
const currentOfflineVideo = ref<Video | null>(null)
const offlineForm = reactive({
  reason: ''
})

const statistics = computed(() => {
  const d = dashboard.value
  const totalVideos = d?.totals?.videoTotal ?? videos.value.length
  const pendingReview = d?.video?.pendingReview ??
    (videos.value.filter(v => v.status === 'reviewing').length + lives.value.filter(l => l.status === 'reviewing').length)

  const approvedCount = d?.video?.approved ??
    videos.value.filter(v => v.status === 'approved' || v.status === 'published').length

  const approvalRate = totalVideos > 0 ? Math.round((approvedCount / totalVideos) * 100) : 0
  const publishedVideos = d?.video?.published ?? videos.value.filter(v => v.status === 'published').length
  const totalPlays = videos.value.reduce((sum, v) => sum + v.playCount, 0)
  const liveCount = d?.totals?.liveTotal ?? lives.value.length

  return {
    totalVideos,
    pendingReview,
    approvalRate,
    publishedVideos,
    totalPlays,
    liveCount,
    activeVolunteers: d?.totals?.volunteerActiveCount ?? 0
  }
})

const publishedVideos = computed(() => {
  return videos.value
    .filter(v => v.status === 'published')
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5)
})

const liveOverview = computed(() => {
  return lives.value
    .filter(l => l.status === 'live' || l.status === 'published' || l.status === 'ended')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)
})

const recentAudits = computed(() => {
  return auditLogs.value.slice(0, 5)
})

const pendingItems = computed(() => {
  const pendingVideos = videos.value
    .filter(v => v.status === 'reviewing')
    .map(v => ({
      id: v.id,
      type: '视频',
      title: v.title,
      createdAt: v.createdAt
    }))
  
  const pendingLives = lives.value
    .filter(l => l.status === 'reviewing')
    .map(l => ({
      id: l.id,
      type: '直播',
      title: l.title,
      createdAt: l.createdAt
    }))
  
  return [...pendingVideos, ...pendingLives].slice(0, 5)
})

// 视频状态分布饼图
const videoStatusPieOption = computed<EChartsOption>(() => {
  const byStatus = dashboard.value?.video?.byStatus || {}
  // 后端统一大写枚举；本页按后端返回渲染（并明确不展示草稿 DRAFT）
  const published = byStatus['PUBLISHED'] ?? 0
  const approved = byStatus['APPROVED'] ?? 0
  const reviewing = byStatus['REVIEW'] ?? 0
  const rejected = byStatus['REJECTED'] ?? 0
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '视频状态',
        type: 'pie',
        radius: '60%',
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\n${params.value}个`
          },
          fontSize: 11,
          lineHeight: 14
        },
        labelLine: {
          length: 12,
          length2: 8
        },
        data: [
          { value: published, name: '已上架', itemStyle: { color: '#67c23a' } },
          { value: approved, name: '审核通过', itemStyle: { color: '#409eff' } },
          { value: reviewing, name: '审核中', itemStyle: { color: '#e6a23c' } },
          { value: rejected, name: '已驳回', itemStyle: { color: '#f56c6c' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
})

// 视频上传趋势
const videoTrendOption = computed<EChartsOption>(() => {
  // 用真实数据替换随机数：目前后端只返回“今日新增”，先用条形图展示即可
  const dates = ['今日']
  const counts = [dashboard.value?.today?.newVideos ?? 0]
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '视频上传数',
        type: 'bar',
        data: counts,
        itemStyle: { color: '#67c23a' },
      }
    ]
  }
})

// 审核通过率趋势
const approvalTrendOption = computed<EChartsOption>(() => {
  // 后端当前未提供 7 日趋势，先用“今日新增直播”作为真实数据占位，避免假数据
  const dates = ['今日']
  const rates = [dashboard.value?.today?.newLives ?? 0]
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '新增直播',
        type: 'bar',
        data: rates,
        itemStyle: { color: '#67c23a' },
      }
    ]
  }
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    // 真实概览数据：由后端汇总，学院管理员会按本学院 scope 返回
    const req = await PlatformApiFp(apiConfig).apiPlatformDashboardGet()
    const res = await req()
    dashboard.value = (res as any)?.data?.data || null

    // 下面三个列表仍用于“已上架视频监控 / 直播概览 / 最近审核记录”，后续可继续换成专用接口
    videos.value = await videoApi.getVideos()
    lives.value = await liveApi.getLives()
    auditLogs.value = await auditApi.getAuditLogs()
  } catch (error) {
    console.error('加载数据失败', error)
    ElMessage.error('加载数据概览失败')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getLiveStatusType = (status: string) => {
  const map: Record<string, string> = {
    live: 'success',
    published: 'warning',
    ended: 'info'
  }
  return map[status] || 'info'
}

const getLiveStatusText = (status: string) => {
  const map: Record<string, string> = {
    live: '直播中',
    published: '已上架',
    ended: '已结束'
  }
  return map[status] || status
}

const handleReview = (item: any) => {
  if (item.type === '视频') {
    router.push(`/college-admin/videos/review?id=${item.id}`)
  } else {
    router.push(`/college-admin/live/review?id=${item.id}`)
  }
}

const handleViewVideo = (_video: Video) => {
  router.push(`/college-admin/videos/manage`)
}

const handleQuickOffline = (video: Video) => {
  currentOfflineVideo.value = video
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmOffline = async () => {
  if (!offlineForm.reason.trim()) {
    ElMessage.warning('请输入下线理由')
    return
  }
  
  if (!currentOfflineVideo.value) return
  
  try {
    // TODO: 调用API下线
    ElMessage.success('已下线')
    offlineDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}
</script>

<style scoped lang="scss">
.dashboard-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
  
  .stats-cards {
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #67c23a;
        margin-bottom: 10px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
      }
    }
  }
  
  .video-overview, .live-overview {
    max-height: 400px;
    overflow-y: auto;
    
    .video-item, .live-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.3s;
      
      &:hover {
        background: #f5f7fa;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .video-info, .live-info {
        flex: 1;
        
        .video-title, .live-title {
          font-weight: 500;
          margin-bottom: 6px;
          color: #333;
        }
        
        .video-meta, .live-meta {
          font-size: 12px;
          color: #999;
        }
      }
    }
    
    .empty-state {
      padding: 40px 0;
      text-align: center;
    }
  }
}
</style>

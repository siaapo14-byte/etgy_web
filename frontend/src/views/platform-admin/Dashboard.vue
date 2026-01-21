<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2>全局仪表盘</h2>
    </div>
    
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalVideos }}</div>
            <div class="stat-label">全平台视频总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalLives }}</div>
            <div class="stat-label">全平台直播总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalChildren }}</div>
            <div class="stat-label">儿童账号总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalVolunteers }}</div>
            <div class="stat-label">志愿者总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 学院对比柱状图 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>学院对比分析</span>
          </template>
          <v-chart :option="collegeBarOption" style="height: 280px" />
        </el-card>
      </el-col>
      
      <!-- 通过率饼图 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>视频通过率分布</span>
          </template>
          <v-chart :option="approvalPieOption" style="height: 280px" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 视频趋势折线图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>视频上传趋势</span>
          </template>
          <v-chart :option="videoTrendOption" style="height: 220px" />
        </el-card>
      </el-col>
      
      <!-- 直播趋势折线图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>直播申请趋势</span>
          </template>
          <v-chart :option="liveTrendOption" style="height: 220px" />
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
              <el-button type="primary" size="small" @click="$router.push('/platform-admin/videos')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="video-overview">
            <div v-for="video in publishedVideos" :key="video.id" class="video-item">
              <div class="video-info" @click="handleViewVideo(video)">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-meta">
                  <span>{{ video.collegeName }}</span>
                  <span style="margin: 0 10px">|</span>
                  <span>播放量: {{ video.playCount }}</span>
                  <span style="margin: 0 10px">|</span>
                  <span>点赞: {{ video.likeCount }}</span>
                </div>
              </div>
              <el-button type="danger" size="small" @click.stop="handleQuickOffline(video)">
                快捷下架
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
              <el-button type="primary" size="small" @click="$router.push('/platform-admin/live')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="live-overview">
            <div v-for="live in liveOverview" :key="live.id" class="live-item">
              <div class="live-info">
                <div class="live-title">{{ live.title }}</div>
                <div class="live-meta">
                  <span>{{ live.collegeName }}</span>
                  <span style="margin: 0 10px">|</span>
                  <el-tag :type="getLiveStatusType(live.status)" size="small">
                    {{ getLiveStatusText(live.status) }}
                  </el-tag>
                  <span style="margin: 0 10px">|</span>
                  <span>{{ formatDate(live.startTime) }}</span>
                </div>
              </div>
              <el-button
                v-if="live.status === 'live' || live.status === 'published'"
                type="danger"
                size="small"
                @click="handleQuickBan(live)"
              >
                封停
              </el-button>
            </div>
            <div v-if="liveOverview.length === 0" class="empty-state">
              <el-empty description="暂无直播" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 学院对比表格 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>学院对比数据</span>
      </template>
      <el-table :data="collegeComparison" style="width: 100%">
        <el-table-column prop="collegeName" label="学院" width="150" />
        <el-table-column prop="videoCount" label="视频数" width="120" />
        <el-table-column prop="liveCount" label="直播数" width="120" />
        <el-table-column prop="approvalRate" label="通过率" width="120">
          <template #default="{ row }">
            {{ row.approvalRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="activeChildren" label="活跃儿童" width="120" />
        <el-table-column prop="activeVolunteers" label="活跃志愿者" width="120" />
      </el-table>
    </el-card>
    
    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="视频详情"
      width="1200px"
    >
      <div v-if="currentPreviewVideo" style="display: flex; gap: 20px">
        <el-row :gutter="20" style="width: 100%">
          <el-col :span="12">
            <div style="background: #000; border-radius: 8px; position: sticky; top: 20px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; overflow: hidden">
              <video
                v-if="currentPreviewVideo.videoUrl"
                :src="currentPreviewVideo.videoUrl"
                controls
                style="width: 100%; height: 100%; object-fit: contain"
              >
                您的浏览器不支持视频播放
              </video>
              <div v-else style="color: #fff; padding: 60px; text-align: center">
                <el-icon style="font-size: 64px; margin-bottom: 20px"><VideoPlay /></el-icon>
                <p style="font-size: 16px">视频文件待上传</p>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <el-descriptions :column="1" border :label-style="{ width: '100px', padding: '12px 0' }" :content-style="{ padding: '12px 0' }">
              <el-descriptions-item label="标题">{{ currentPreviewVideo.title }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ currentPreviewVideo.description }}</el-descriptions-item>
              <el-descriptions-item label="学院">{{ currentPreviewVideo.collegeName }}</el-descriptions-item>
              <el-descriptions-item label="志愿者">{{ currentPreviewVideo.volunteerName }}</el-descriptions-item>
              <el-descriptions-item label="学科">{{ currentPreviewVideo.subject }}</el-descriptions-item>
              <el-descriptions-item label="年级">{{ currentPreviewVideo.grade.join(', ') }}</el-descriptions-item>
              <el-descriptions-item label="标签">{{ currentPreviewVideo.tags.join(', ') }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentPreviewVideo.status === 'published' ? 'success' : 'info'">
                  {{ currentPreviewVideo.status === 'published' ? '已上架' : '已下架' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="播放量">{{ currentPreviewVideo.playCount }}</el-descriptions-item>
              <el-descriptions-item label="点赞数">{{ currentPreviewVideo.likeCount }}</el-descriptions-item>
              <el-descriptions-item label="收藏数">{{ currentPreviewVideo.collectCount }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(currentPreviewVideo.createdAt) }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 快捷下架对话框 -->
    <el-dialog
      v-model="offlineDialogVisible"
      title="快捷下架"
      width="500px"
    >
      <el-form :model="offlineForm">
        <el-form-item label="视频标题">
          <div>{{ currentOfflineVideo?.title }}</div>
        </el-form-item>
        <el-form-item label="下架理由">
          <el-input
            v-model="offlineForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入下架理由（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="offlineDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmOffline">确认下架</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { videoApi, liveApi, childApi, volunteerApi, collegeApi } from '@/utils/api'
import type { Video, Live, Child, Volunteer, College } from '@/utils/mockData'
import type { EChartsOption } from 'echarts'

const router = useRouter()

const videos = ref<Video[]>([])
const lives = ref<Live[]>([])
const children = ref<Child[]>([])
const volunteers = ref<Volunteer[]>([])
const colleges = ref<College[]>([])

const offlineDialogVisible = ref(false)
const currentOfflineVideo = ref<Video | null>(null)
const offlineForm = reactive({
  reason: ''
})

const statistics = computed(() => {
  return {
    totalVideos: videos.value.length,
    totalLives: lives.value.length,
    totalChildren: children.value.length,
    totalVolunteers: volunteers.value.length
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

const collegeComparison = computed(() => {
  return colleges.value.map(college => {
    const collegeVideos = videos.value.filter(v => v.collegeId === college.id)
    const collegeLives = lives.value.filter(l => l.collegeId === college.id)
    const collegeChildren = children.value.filter(c => c.collegeId === college.id)
    const collegeVolunteers = volunteers.value.filter(v => v.collegeId === college.id)
    
    const approvedVideos = collegeVideos.filter(v => v.status === 'approved' || v.status === 'published')
    const approvalRate = collegeVideos.length > 0 
      ? Math.round((approvedVideos.length / collegeVideos.length) * 100) 
      : 0
    
    return {
      collegeName: college.name,
      videoCount: collegeVideos.length,
      liveCount: collegeLives.length,
      approvalRate,
      activeChildren: collegeChildren.filter(c => c.status === 'active').length,
      activeVolunteers: collegeVolunteers.filter(v => v.status === 'active').length
    }
  })
})

// 学院对比柱状图
const collegeBarOption = computed<EChartsOption>(() => {
  const comparison = collegeComparison.value
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['视频数', '直播数', '活跃儿童', '活跃志愿者']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: comparison.map(c => c.collegeName)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '视频数',
        type: 'bar',
        data: comparison.map(c => c.videoCount),
        itemStyle: { color: '#ff4757' }
      },
      {
        name: '直播数',
        type: 'bar',
        data: comparison.map(c => c.liveCount),
        itemStyle: { color: '#ffa502' }
      },
      {
        name: '活跃儿童',
        type: 'bar',
        data: comparison.map(c => c.activeChildren),
        itemStyle: { color: '#2ed573' }
      },
      {
        name: '活跃志愿者',
        type: 'bar',
        data: comparison.map(c => c.activeVolunteers),
        itemStyle: { color: '#5352ed' }
      }
    ]
  }
})

// 通过率饼图
const approvalPieOption = computed<EChartsOption>(() => {
  const total = videos.value.length
  const approved = videos.value.filter(v => v.status === 'approved' || v.status === 'published').length
  const rejected = videos.value.filter(v => v.status === 'rejected').length
  const reviewing = videos.value.filter(v => v.status === 'reviewing').length
  
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
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\n${params.value}个\n(${params.percent}%)`
          },
          fontSize: 12,
          lineHeight: 16
        },
        labelLine: {
          length: 15,
          length2: 10
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: approved, name: '已通过', itemStyle: { color: '#67c23a' } },
          { value: rejected, name: '已驳回', itemStyle: { color: '#f56c6c' } },
          { value: reviewing, name: '审核中', itemStyle: { color: '#e6a23c' } }
        ]
      }
    ]
  }
})

// 视频趋势折线图
const videoTrendOption = computed<EChartsOption>(() => {
  // 模拟最近7天的数据
  const dates = []
  const counts = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
    counts.push(Math.floor(Math.random() * 10) + 5)
  }
  
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
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: { color: '#ff4757' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 71, 87, 0.3)' },
              { offset: 1, color: 'rgba(255, 71, 87, 0.1)' }
            ]
          }
        }
      }
    ]
  }
})

// 直播趋势折线图
const liveTrendOption = computed<EChartsOption>(() => {
  const dates = []
  const counts = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
    counts.push(Math.floor(Math.random() * 5) + 2)
  }
  
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
        name: '直播申请数',
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: { color: '#ffa502' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 165, 2, 0.3)' },
              { offset: 1, color: 'rgba(255, 165, 2, 0.1)' }
            ]
          }
        }
      }
    ]
  }
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    videos.value = await videoApi.getVideos()
    lives.value = await liveApi.getLives()
    children.value = await childApi.getChildren()
    volunteers.value = await volunteerApi.getVolunteers()
    colleges.value = await collegeApi.getColleges()
  } catch (error) {
    console.error('加载数据失败', error)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
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

const previewDialogVisible = ref(false)
const currentPreviewVideo = ref<Video | null>(null)

const handleViewVideo = (video: Video) => {
  currentPreviewVideo.value = video
  previewDialogVisible.value = true
}

const handleQuickOffline = (video: Video) => {
  currentOfflineVideo.value = video
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmOffline = async () => {
  if (!offlineForm.reason.trim()) {
    ElMessage.warning('请输入下架理由')
    return
  }
  
  if (!currentOfflineVideo.value) return
  
  try {
    // TODO: 调用API下架
    ElMessage.success('已下架')
    offlineDialogVisible.value = false
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleQuickBan = async (live: Live) => {
  try {
    await ElMessageBox.confirm('确定要封停这个直播吗？', '警告', {
      type: 'warning'
    })
    // TODO: 调用API封停
    ElMessage.success('已封停')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
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
        color: #ff4757;
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

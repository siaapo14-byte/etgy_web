<template>
  <div class="login-container">
    <div class="login-box">
      <Logo />
      <p class="subtitle">学校对口帮扶的治理型公益教育系统</p>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="role">
          <el-select
            v-model="loginForm.role"
            placeholder="请选择角色"
            size="large"
            style="width: 100%"
            @change="handleRoleChange"
          >
            <el-option label="志愿者" value="volunteer" />
            <el-option label="学院管理员" value="college_admin" />
            <el-option label="平台管理员" value="platform_admin" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-alert
        type="info"
        :closable="false"
        style="margin-top: 20px"
      >
        <template #title>
          <div style="font-size: 12px; line-height: 1.8">
            <p><strong>开发阶段测试账号：</strong></p>
            <p>• 志愿者：账号 volunteer / 密码 123456（角色选择：志愿者）</p>
            <p>• 学院管理员：账号 admin / 密码 123456（角色选择：学院管理员）</p>
            <p>• 平台管理员：账号 platform / 密码 123456（角色选择：平台管理员）</p>
            <p style="margin-top: 8px; color: #e6a23c;"><strong>注意：</strong>账号、密码和角色必须匹配，否则无法登录</p>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import Logo from '@/components/Logo.vue'
import { AuthApiFp } from '@/api-services/apis/auth-api'
import { UsersApiFp } from '@/api-services/apis/users-api'
import { AuthLoginBodyRoleEnum, type AuthLoginBody } from '@/api-services/models'
import { apiConfig, loginConfig } from '@/apiClient'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  role: 'volunteer' as 'volunteer' | 'college_admin' | 'platform_admin'
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const handleRoleChange = () => {
  // 角色改变时，根据角色提示对应的账号格式
  const roleHints: Record<string, string> = {
    volunteer: '志愿者账号：学号格式（如：2021001）或 volunteer',
    college_admin: '学院管理员账号：admin 或 管理员工号',
    platform_admin: '平台管理员账号：platform 或 平台管理员账号'
  }
  if (loginForm.role && roleHints[loginForm.role]) {
    // 可以在这里添加提示
  }
}

// 前端角色到后端登录枚举的映射
const mapRoleToApiRole = (role: 'volunteer' | 'college_admin' | 'platform_admin'): AuthLoginBody['role'] => {
  switch (role) {
    case 'volunteer':
      return AuthLoginBodyRoleEnum.VOLUNTEER
    case 'college_admin':
      return AuthLoginBodyRoleEnum.COLLEGEADMIN
    case 'platform_admin':
      return AuthLoginBodyRoleEnum.PLATFORMADMIN
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 调用后端 /api/auth/login 接口
        const body: AuthLoginBody = {
          username: loginForm.username,
          password: loginForm.password,
          role: mapRoleToApiRole(loginForm.role)
        }

        console.log('📝 登录请求:', body)
        
        // 使用登录专用配置（不包含 token）来调用登录接口
        const request = await AuthApiFp(loginConfig).apiAuthLoginPost(body)
        const response = await request()
        
        console.log('✅ 登录响应:', response)
        
        const resData = response.data.data

        if (!resData || !resData.token) {
          throw new Error('登录返回数据异常')
        }

        // 保存 token（写入 local/sessionStorage，apiConfig.accessToken 会读取）
        userStore.setToken(resData.token)
        console.log('🔑 Token已保存:', resData.token.substring(0, 20) + '...')

        // 获取完整的用户信息（包含学院信息）
        let finalUser: any = resData.user || {}
        try {
          console.log('🔍 获取用户详细信息...')
          const meReq = await UsersApiFp(apiConfig).apiUsersMeGet()
          const meRes = await meReq()
          console.log('✅ 用户详细信息响应:', meRes)
          // 兼容生成代码的不同返回包装
          const mePayload = meRes?.data?.data ?? meRes?.data
          if (mePayload) {
            finalUser = mePayload
          }
        } catch (e) {
          // 若 /me 调用失败，回退到登录返回的 user
          console.warn('获取用户详细信息失败，使用登录返回的基础信息', e)
        }

        const backendRole = (finalUser.role || finalUser.user?.role || '').toString().toUpperCase()
        const finalRole: 'volunteer' | 'college_admin' | 'platform_admin' =
          backendRole === 'PLATFORM_ADMIN'
            ? 'platform_admin'
            : backendRole === 'COLLEGE_ADMIN'
              ? 'college_admin'
              : 'volunteer'

        // 根据用户角色从不同的 profile 中提取学院信息
        let collegeId: number | null = null
        let collegeName: string = ''
        let realName: string = ''

        if (finalUser.adminProfile) {
          // 学院管理员：从 adminProfile 中获取
          collegeId = finalUser.adminProfile.collegeId ?? finalUser.adminProfile.college?.id ?? null
          collegeName = finalUser.adminProfile.college?.name ?? ''
          realName = finalUser.adminProfile.realName ?? ''
        } else if (finalUser.volunteerProfile) {
          // 志愿者：从 volunteerProfile 中获取
          collegeId = finalUser.volunteerProfile.collegeId ?? finalUser.volunteerProfile.college?.id ?? null
          collegeName = finalUser.volunteerProfile.college?.name ?? ''
          realName = finalUser.volunteerProfile.realName ?? ''
        } else {
          // 兜底：从根级字段获取（平台管理员或旧数据格式）
          collegeId = finalUser.collegeId ?? finalUser.college?.id ?? null
          collegeName = finalUser.collegeName ?? finalUser.college?.name ?? ''
          realName = finalUser.realName ?? finalUser.name ?? ''
        }

        userStore.setUser({
          id: finalUser.id ?? resData.user?.id ?? 0,
          username: finalUser.username ?? resData.user?.username ?? loginForm.username,
          name: realName || (finalUser.name ?? resData.user?.name ?? loginForm.username),
          role: finalRole,
          collegeId: collegeId ?? undefined,
          collegeName: collegeName
        })

        ElMessage.success('登录成功')

        // 根据角色跳转
        if (finalRole === 'volunteer') {
          router.push('/volunteer')
        } else if (finalRole === 'college_admin') {
          router.push('/college-admin')
        } else {
          router.push('/platform-admin')
        }
      } catch (error: any) {
        console.error('❌ 登录错误:', error)
        
        // 提取详细的错误信息
        let errorMsg = error.message || '登录失败'
        if (error.response) {
          const status = error.response.status
          const data = error.response.data
          console.error('❌ HTTP错误信息:', { status, data })
          
          if (status === 401) {
            errorMsg = '账号或密码错误，或角色不匹配'
          } else if (status === 400) {
            errorMsg = data?.message || data?.error || '请求参数错误'
          } else if (status === 404) {
            errorMsg = '登录接口未找到，请检查后端地址'
          } else {
            errorMsg = data?.message || data?.error || `登录失败: HTTP ${status}`
          }
        }
        
        ElMessage.error(errorMsg)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #ffe0e0 25%, #e0ffe0 50%, #e0e0ff 75%, #ffffff 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  :deep(.logo-container) {
    justify-content: center;
    margin-bottom: 20px;
    
    .logo-image {
      height: 80px;
    }
  }
}

.subtitle {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.login-form {
  margin-top: 30px;
}

.tips {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
  
  p {
    margin: 4px 0;
  }
}
</style>


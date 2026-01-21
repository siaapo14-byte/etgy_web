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
import { AuthLoginBodyRoleEnum, type AuthLoginBody } from '@/api-services/models'
import { apiConfig } from '@/apiClient'

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

        const request = await AuthApiFp(apiConfig).apiAuthLoginPost(body)
        const response = await request()
        const resData = response.data.data

        if (!resData || !resData.token) {
          throw new Error('登录返回数据异常')
        }

        // 保存 token
        userStore.setToken(resData.token)

        // 从后端返回 user 中提取必要字段，兼容后端字段命名
        const apiUser: any = resData.user || {}
        const backendRole = (apiUser.role || '').toString().toUpperCase()
        const finalRole: 'volunteer' | 'college_admin' | 'platform_admin' =
          backendRole === 'PLATFORM_ADMIN'
            ? 'platform_admin'
            : backendRole === 'COLLEGE_ADMIN'
              ? 'college_admin'
              : 'volunteer'

        userStore.setUser({
          id: apiUser.id ?? 0,
          username: apiUser.username ?? loginForm.username,
          name: apiUser.name ?? apiUser.realName ?? loginForm.username,
          role: finalRole,
          collegeId: apiUser.collegeId,
          collegeName: apiUser.collegeName
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
        ElMessage.error(error.message || '登录失败')
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


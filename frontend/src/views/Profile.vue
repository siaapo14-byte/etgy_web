<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>个人资料</h2>
    </div>
    
    <el-card>
      <el-form :model="profileForm" :rules="rules" ref="formRef" label-width="120px" style="max-width: 600px">
        <el-form-item label="账号">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="profileForm.name" />
        </el-form-item>
        
        <el-form-item v-if="userStore.user?.collegeName" label="所属学院">
          <el-input :value="userStore.user.collegeName" disabled />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-input :value="roleText" disabled />
        </el-form-item>
        
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="profileForm.oldPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="profileForm.newPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="profileForm.confirmPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()

const profileForm = reactive({
  username: userStore.user?.username || '',
  name: userStore.user?.name || '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const roleText = computed(() => {
  const role = userStore.user?.role
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    college_admin: '学院管理员',
    platform_admin: '平台管理员'
  }
  return role ? roleMap[role] : ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== profileForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

onMounted(() => {
  if (userStore.user) {
    profileForm.username = userStore.user.username
    profileForm.name = userStore.user.name
  }
})

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用API更新
        if (userStore.user) {
          userStore.setUser({
            ...userStore.user,
            name: profileForm.name
          })
        }
        ElMessage.success('保存成功')
        profileForm.oldPassword = ''
        profileForm.newPassword = ''
        profileForm.confirmPassword = ''
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      }
    }
  })
}

const handleReset = () => {
  if (userStore.user) {
    profileForm.name = userStore.user.name
  }
  profileForm.oldPassword = ''
  profileForm.newPassword = ''
  profileForm.confirmPassword = ''
  formRef.value?.clearValidate()
}
</script>

<style scoped lang="scss">
.profile-page {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
    }
  }
}
</style>

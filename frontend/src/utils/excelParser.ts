/**
 * Excel/CSV文件解析工具
 * 用于批量导入功能
 */

/**
 * 解析CSV文件内容
 */
export function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        // 处理BOM
        const content = text.replace(/^\uFEFF/, '')
        const lines = content.split('\n').filter(line => line.trim())
        
        const result: string[][] = []
        for (const line of lines) {
          // 跳过以#开头的注释行
          if (line.trim().startsWith('#')) {
            continue
          }
          // 简单的CSV解析（处理逗号分隔）
          const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
          if (row.length > 0 && row.some(cell => cell)) {
            result.push(row)
          }
        }
        
        resolve(result)
      } catch (error) {
        reject(new Error('CSV文件解析失败'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 解析Excel文件
 * 当前仅支持CSV格式（.xlsx和.xls需要转换为CSV）
 */
export async function parseExcel(file: File): Promise<string[][]> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(file)
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    // 提示用户转换为CSV
    throw new Error('当前仅支持CSV格式，请将Excel文件另存为CSV格式后重试。\n操作方法：在Excel中选择"文件" -> "另存为" -> 文件类型选择"CSV UTF-8(逗号分隔)(*.csv)"')
  } else {
    throw new Error('不支持的文件格式，请上传CSV文件')
  }
}

/**
 * 验证儿童账号导入数据
 */
export function validateChildrenData(rows: string[][]): { valid: boolean; errors: string[]; data: any[] } {
  const errors: string[] = []
  const data: any[] = []
  
  if (rows.length < 2) {
    errors.push('文件至少需要包含表头和数据行')
    return { valid: false, errors, data }
  }
  
  // 跳过表头
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) {
      errors.push(`第${i + 1}行数据不完整`)
      continue
    }
    
    const [name, gender, grade, school] = row
    
    if (!name || !name.trim()) {
      errors.push(`第${i + 1}行：姓名不能为空`)
      continue
    }
    
    if (gender !== '男' && gender !== '女') {
      errors.push(`第${i + 1}行：性别必须为"男"或"女"`)
      continue
    }
    
    const validGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
    if (!validGrades.includes(grade)) {
      errors.push(`第${i + 1}行：年级格式不正确`)
      continue
    }
    
    if (!school || !school.trim()) {
      errors.push(`第${i + 1}行：学校不能为空`)
      continue
    }
    
    data.push({ name: name.trim(), gender, grade, school: school.trim() })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data
  }
}

/**
 * 验证学院管理员导入数据
 */
export function validateCollegeAdminData(rows: string[][]): { valid: boolean; errors: string[]; data: any[] } {
  const errors: string[] = []
  const data: any[] = []
  
  if (rows.length < 2) {
    errors.push('文件至少需要包含表头和数据行')
    return { valid: false, errors, data }
  }
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) {
      errors.push(`第${i + 1}行数据不完整`)
      continue
    }
    
    const [username, name, password, collegeName] = row
    
    if (!username || !username.trim()) {
      errors.push(`第${i + 1}行：工号不能为空`)
      continue
    }
    
    if (!name || !name.trim()) {
      errors.push(`第${i + 1}行：姓名不能为空`)
      continue
    }
    
    if (!password || password.length < 6) {
      errors.push(`第${i + 1}行：密码至少6位`)
      continue
    }
    
    if (!collegeName || !collegeName.trim()) {
      errors.push(`第${i + 1}行：所属学院不能为空`)
      continue
    }
    
    data.push({
      username: username.trim(),
      name: name.trim(),
      password: password.trim(),
      collegeName: collegeName.trim()
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data
  }
}

/**
 * 验证志愿者导入数据
 */
export function validateVolunteerData(rows: string[][]): { valid: boolean; errors: string[]; data: any[] } {
  const errors: string[] = []
  const data: any[] = []
  
  if (rows.length < 2) {
    errors.push('文件至少需要包含表头和数据行')
    return { valid: false, errors, data }
  }
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 5) {
      errors.push(`第${i + 1}行数据不完整`)
      continue
    }
    
    const [studentId, name, gender, phone, email] = row
    
    if (!studentId || !studentId.trim()) {
      errors.push(`第${i + 1}行：学号不能为空`)
      continue
    }
    
    if (!name || !name.trim()) {
      errors.push(`第${i + 1}行：姓名不能为空`)
      continue
    }
    
    if (gender !== '男' && gender !== '女') {
      errors.push(`第${i + 1}行：性别必须为"男"或"女"`)
      continue
    }
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      errors.push(`第${i + 1}行：手机号格式不正确`)
      continue
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`第${i + 1}行：邮箱格式不正确`)
      continue
    }
    
    data.push({
      studentId: studentId.trim(),
      name: name.trim(),
      gender,
      phone: phone.trim(),
      email: email.trim()
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data
  }
}

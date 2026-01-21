/**
 * Excel模板下载工具
 */

/**
 * 下载儿童账号导入模板
 */
export function downloadChildrenTemplate() {
  // 创建CSV格式的模板（Excel可以打开CSV）
  const headers = ['姓名', '性别', '年级', '学校']
  const example = ['小明', '男', '三年级', '希望小学']
  
  // 注意：CSV文件中以#开头的行会被忽略，作为注释
  const csvContent = [
    headers.join(','),
    example.join(','),
    '# 以下为填写说明（以#开头，导入时会被自动忽略）：',
    '# 1. 性别请填写：男 或 女',
    '# 2. 年级请填写：一年级、二年级、三年级、四年级、五年级、六年级',
    '# 3. 请勿修改表头，只填写数据行',
    '# 4. 每行代表一个儿童账号',
    '# 5. 删除示例行后填写实际数据'
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', '儿童账号导入模板.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 下载学院管理员导入模板
 */
export function downloadCollegeAdminTemplate() {
  const headers = ['工号', '姓名', '初始密码', '所属学院']
  const example = ['A001', '李管理员', '123456', '数学学院']
  
  const csvContent = [
    headers.join(','),
    example.join(','),
    '# 以下为填写说明（以#开头，导入时会被自动忽略）：',
    '# 1. 工号：学院管理员的唯一标识',
    '# 2. 初始密码：建议使用6位以上数字或字母',
    '# 3. 所属学院：请填写准确的学院名称',
    '# 4. 请勿修改表头，只填写数据行',
    '# 5. 每行代表一个学院管理员账号',
    '# 6. 删除示例行后填写实际数据'
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', '学院管理员导入模板.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 下载志愿者导入模板
 */
export function downloadVolunteerTemplate() {
  const headers = ['学号', '姓名', '性别', '联系方式', '邮箱']
  const example = ['2021001', '张同学', '男', '13800138001', 'zhang@example.com']
  
  const csvContent = [
    headers.join(','),
    example.join(','),
    '# 以下为填写说明（以#开头，导入时会被自动忽略）：',
    '# 1. 学号：志愿者的学号，作为登录账号',
    '# 2. 性别：请填写 男 或 女',
    '# 3. 联系方式：手机号码',
    '# 4. 邮箱：有效的邮箱地址',
    '# 5. 请勿修改表头，只填写数据行',
    '# 6. 每行代表一个志愿者账号',
    '# 7. 删除示例行后填写实际数据'
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', '志愿者导入模板.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

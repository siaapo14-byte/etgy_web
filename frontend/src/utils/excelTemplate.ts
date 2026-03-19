/**
 * Excel模板下载工具
 *
 * 注意：优先复用 utils/api.ts 里的适配层（childApi/volunteerApi/collegeApi）
 * 避免在这里直接调用 swagger 生成代码导致重复与分叉。
 */

import { childApi } from '@/utils/api'

/**
 * 下载儿童账号导入模板
 */
export async function downloadChildrenTemplate() {
  // 复用适配层：/api/users/children/batch-excel/template
  await childApi.downloadChildrenTemplate()
}

/**
 * 下载学院管理员导入模板
 */
export async function downloadCollegeAdminTemplate() {
  // 优先走后端模板接口（若后端尚未提供，则提示调用方降级为 CSV）
  // TODO: 若 swagger 暴露了学院管理员模板下载接口，请在这里替换调用。
  throw new Error('后端暂未提供学院管理员 xlsx 模板下载接口')
}

/**
 * 下载志愿者导入模板
 */
export async function downloadVolunteerTemplate() {
  // TODO: 若 swagger 暴露了志愿者模板下载接口，请在这里替换调用。
  throw new Error('后端暂未提供志愿者 xlsx 模板下载接口')
}

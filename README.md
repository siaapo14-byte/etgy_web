# 益路同行 - 学校对口帮扶的治理型公益教育系统

## 项目简介

作为教育系统内部的多学院教学平台，本系统旨在为对口帮扶县小学的农村留守儿童提供安全、稳定、可持续的在线学习与心理关怀环境。

## 技术栈

### 后端
- Node.js
- Express
- MySQL
- Redis

### 前端
- Vue 3
- TypeScript
- Axios（待后端接口完成后集成）

## 项目结构

```
.
├── backend/          # 后端服务
│   ├── src/
│   ├── config/
│   └── package.json
├── frontend/         # 前端应用
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## 开发说明

### 前端开发阶段
- 使用硬编码数据渲染页面
- 保证业务逻辑正确
- 预留接口调用位置（使用axios）
- 待后端Swagger文档完成后统一替换

### 角色说明
1. **志愿者端**：视频上传、直播申请、数据查看
2. **学院管理员端**：内容审核、志愿者管理、数据监控
3. **平台管理员端**：全局管理、账号建档、数据对比

## 启动说明

### 后端
```bash
cd backend
npm install
npm run dev
```

### 前端
```bash
cd frontend
npm install
npm run dev
```


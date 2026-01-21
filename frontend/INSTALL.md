# 安装说明

## 安装依赖

在项目根目录下运行：

```bash
cd frontend
npm install
```

## 新增依赖说明

项目新增了以下依赖用于数据可视化：

- `echarts`: ECharts图表库核心
- `vue-echarts`: Vue 3的ECharts组件封装

安装完成后，重新启动开发服务器：

```bash
npm run dev
```

## 如果安装失败

如果 `vue-echarts` 安装失败，可以尝试：

```bash
npm install vue-echarts@next --legacy-peer-deps
```

或者使用：

```bash
npm install echarts vue-echarts@6.6.1 --legacy-peer-deps
```

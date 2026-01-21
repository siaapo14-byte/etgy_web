const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '益路同行后端服务运行中' });
});

// TODO: 路由将在后续添加
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/videos', require('./routes/videos'));
// app.use('/api/live', require('./routes/live'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/admin', require('./routes/admin'));

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});


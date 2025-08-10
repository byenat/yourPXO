import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import WebSocket from 'ws';

// Import services
import { Database } from './database/Database';
import { Logger } from './utils/Logger';

// Import routes
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { contentRoutes } from './routes/content';
import { aiRoutes } from './routes/ai';
import { hinataRoutes } from './routes/hinata';
import { syncRoutes } from './routes/sync';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 创建HTTP服务器
const server = createServer(app);

// 创建WebSocket服务器用于实时同步
const wss = new WebSocket.Server({ server });

// 初始化数据库
const database = new Database();
database.initialize();

// 安全和性能中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 基础中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// 速率限制
app.use(rateLimitMiddleware);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'yourPXO Core API',
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/hinata', authMiddleware, hinataRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);

// WebSocket连接处理
wss.on('connection', (ws, request) => {
  Logger.info('新的WebSocket连接建立');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      // 处理实时同步消息
      handleRealtimeMessage(ws, data);
    } catch (error) {
      Logger.error('WebSocket消息处理错误:', error);
    }
  });

  ws.on('close', () => {
    Logger.info('WebSocket连接关闭');
  });
});

// 实时消息处理
function handleRealtimeMessage(ws: WebSocket, data: any) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    case 'sync_request':
      // 处理同步请求
      break;
    default:
      Logger.warn('未知的WebSocket消息类型:', data.type);
  }
}

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
server.listen(port, () => {
  Logger.info(`yourPXO Core API服务启动成功，端口: ${port}`);
  Logger.info(`WebSocket服务器已启动`);
});



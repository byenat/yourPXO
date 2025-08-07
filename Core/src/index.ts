import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ByenatOSService } from './services/ByenatOSService';
import { UserService } from './services/UserService';
import { DeviceService } from './services/DeviceService';
import { ConfigService } from './services/ConfigService';
import { Logger } from './utils/Logger';
import { Database } from './database/Database';

// 加载环境变量
dotenv.config();

class CoreServer {
  private app: express.Application;
  private port: number;
  private byenatOSService: ByenatOSService;
  private userService: UserService;
  private deviceService: DeviceService;
  private configService: ConfigService;
  private logger: Logger;
  private database: Database;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001');
    this.app = express();
    this.logger = new Logger();
    this.database = new Database();
    
    // 初始化服务
    this.byenatOSService = new ByenatOSService();
    this.userService = new UserService(this.database);
    this.deviceService = new DeviceService(this.database);
    this.configService = new ConfigService(this.database);
    
    this.initialize();
  }

  private async initialize() {
    try {
      // 初始化数据库
      await this.database.initialize();
      
      // 设置中间件
      this.setupMiddleware();
      
      // 设置路由
      this.setupRoutes();
      
      // 启动服务器
      this.start();
      
      this.logger.info('Core server initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize core server', error);
      process.exit(1);
    }
  }

  private setupMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS中间件
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    // JSON解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 日志中间件
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // 用户相关路由
    this.app.post('/api/user/register', this.userService.register.bind(this.userService));
    this.app.post('/api/user/login', this.userService.login.bind(this.userService));
    this.app.get('/api/user/profile', this.userService.getProfile.bind(this.userService));
    this.app.put('/api/user/profile', this.userService.updateProfile.bind(this.userService));

    // 设备相关路由
    this.app.post('/api/device/register', this.deviceService.register.bind(this.deviceService));
    this.app.put('/api/device/status', this.deviceService.updateStatus.bind(this.deviceService));
    this.app.get('/api/device/list', this.deviceService.getDevices.bind(this.deviceService));

    // 配置相关路由
    this.app.get('/api/config/user', this.configService.getUserConfig.bind(this.configService));
    this.app.put('/api/config/user', this.configService.updateUserConfig.bind(this.configService));
    this.app.get('/api/config/device/:deviceId', this.configService.getDeviceConfig.bind(this.configService));
    this.app.put('/api/config/device/:deviceId', this.configService.updateDeviceConfig.bind(this.configService));

    // byenatOS AI相关路由
    this.app.post('/api/ai/personalized-prompt', this.byenatOSService.getPersonalizedPrompt.bind(this.byenatOSService));
    this.app.post('/api/ai/update-activity', this.byenatOSService.updateActivity.bind(this.byenatOSService));
    this.app.post('/api/ai/analyze-content', this.byenatOSService.analyzeContent.bind(this.byenatOSService));
    this.app.post('/api/ai/focus-analysis', this.byenatOSService.analyzeFocus.bind(this.byenatOSService));

    // 错误处理中间件
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private start() {
    this.app.listen(this.port, () => {
      this.logger.info(`Core server running on port ${this.port}`);
    });
  }
}

// 启动服务器
new CoreServer();

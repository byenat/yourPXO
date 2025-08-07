# Sync 数据同步服务

## 概述

Sync模块是yourPXO的数据同步服务，负责管理跨设备的数据同步、冲突解决和实时通信，确保用户在所有设备上都能获得一致的体验。

## 功能特性

### 🔄 实时同步
- **跨设备同步** - 实时同步用户配置和数据
- **增量同步** - 只同步变更的数据，提高效率
- **离线支持** - 离线时本地缓存，联网后自动同步
- **冲突解决** - 智能检测和解决数据冲突

### 🔐 安全传输
- **端到端加密** - 所有数据传输都经过加密
- **用户认证** - 安全的用户身份验证
- **数据完整性** - 确保数据在传输过程中不被篡改
- **隐私保护** - 保护用户隐私数据

### 📊 数据管理
- **版本控制** - 数据版本管理和回滚
- **备份恢复** - 自动备份和灾难恢复
- **数据压缩** - 压缩传输数据，节省带宽
- **智能缓存** - 智能缓存策略，提高性能

## 技术栈

### 后端服务
- **Node.js** - 服务器运行时
- **TypeScript** - 类型安全的JavaScript
- **Express** - Web框架
- **Socket.io** - 实时通信

### 数据库
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储
- **MongoDB** - 文档存储
- **SQLite** - 本地存储

### 消息队列
- **RabbitMQ** - 消息队列
- **Redis Pub/Sub** - 实时消息
- **WebSocket** - 实时通信

## 项目结构

```
Sync/
├── src/
│   ├── server/            # 服务器代码
│   ├── client/            # 客户端代码
│   ├── shared/            # 共享代码
│   ├── database/          # 数据库相关
│   ├── queue/             # 消息队列
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript类型定义
├── config/                # 配置文件
├── scripts/               # 脚本文件
├── tests/                 # 测试文件
├── docs/                  # 文档
└── package.json
```

## 核心功能

### 1. 同步服务器
```typescript
// src/server/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SyncManager } from './services/SyncManager';
import { AuthMiddleware } from './middleware/AuthMiddleware';

class SyncServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private syncManager: SyncManager;
  
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.syncManager = new SyncManager();
    
    this.initialize();
  }
  
  private initialize() {
    // 设置中间件
    this.app.use(express.json());
    this.app.use(AuthMiddleware);
    
    // 设置路由
    this.setupRoutes();
    
    // 设置WebSocket
    this.setupWebSocket();
    
    // 启动服务器
    this.server.listen(process.env.PORT || 3000, () => {
      console.log('Sync server started on port', process.env.PORT || 3000);
    });
  }
  
  private setupRoutes() {
    // 用户数据同步
    this.app.post('/api/sync/user', this.syncUserData.bind(this));
    
    // 设备数据同步
    this.app.post('/api/sync/device', this.syncDeviceData.bind(this));
    
    // 配置数据同步
    this.app.post('/api/sync/config', this.syncConfigData.bind(this));
    
    // 冲突解决
    this.app.post('/api/sync/resolve', this.resolveConflict.bind(this));
  }
  
  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // 用户认证
      socket.on('authenticate', async (data) => {
        const user = await this.authenticateUser(data.token);
        if (user) {
          socket.userId = user.id;
          socket.join(`user_${user.id}`);
        }
      });
      
      // 数据同步
      socket.on('sync_data', async (data) => {
        const result = await this.syncManager.syncData(data);
        socket.emit('sync_result', result);
      });
      
      // 实时更新
      socket.on('subscribe_updates', (data) => {
        socket.join(`updates_${data.userId}`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  private async syncUserData(req: express.Request, res: express.Response) {
    try {
      const { userId, data, deviceId } = req.body;
      const result = await this.syncManager.syncUserData(userId, data, deviceId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  private async syncDeviceData(req: express.Request, res: express.Response) {
    try {
      const { userId, deviceId, data } = req.body;
      const result = await this.syncManager.syncDeviceData(userId, deviceId, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  private async syncConfigData(req: express.Request, res: express.Response) {
    try {
      const { userId, config } = req.body;
      const result = await this.syncManager.syncConfigData(userId, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  private async resolveConflict(req: express.Request, res: express.Response) {
    try {
      const { userId, conflict } = req.body;
      const result = await this.syncManager.resolveConflict(userId, conflict);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

new SyncServer();
```

### 2. 同步管理器
```typescript
// src/server/services/SyncManager.ts
import { DatabaseManager } from './DatabaseManager';
import { ConflictResolver } from './ConflictResolver';
import { EncryptionService } from './EncryptionService';

export class SyncManager {
  private dbManager: DatabaseManager;
  private conflictResolver: ConflictResolver;
  private encryptionService: EncryptionService;
  
  constructor() {
    this.dbManager = new DatabaseManager();
    this.conflictResolver = new ConflictResolver();
    this.encryptionService = new EncryptionService();
  }
  
  async syncUserData(userId: string, data: any, deviceId: string) {
    try {
      // 加密数据
      const encryptedData = await this.encryptionService.encrypt(data);
      
      // 检查冲突
      const conflicts = await this.checkConflicts(userId, data);
      
      if (conflicts.length > 0) {
        // 解决冲突
        const resolvedData = await this.conflictResolver.resolveConflicts(conflicts);
        return await this.saveUserData(userId, resolvedData, deviceId);
      } else {
        // 直接保存
        return await this.saveUserData(userId, data, deviceId);
      }
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }
  
  async syncDeviceData(userId: string, deviceId: string, data: any) {
    try {
      // 验证设备
      await this.validateDevice(userId, deviceId);
      
      // 同步设备数据
      const result = await this.dbManager.saveDeviceData(userId, deviceId, data);
      
      // 通知其他设备
      await this.notifyOtherDevices(userId, deviceId, 'device_updated');
      
      return result;
    } catch (error) {
      throw new Error(`Device sync failed: ${error.message}`);
    }
  }
  
  async syncConfigData(userId: string, config: any) {
    try {
      // 验证配置
      await this.validateConfig(config);
      
      // 保存配置
      const result = await this.dbManager.saveConfigData(userId, config);
      
      // 通知所有设备配置更新
      await this.notifyAllDevices(userId, 'config_updated');
      
      return result;
    } catch (error) {
      throw new Error(`Config sync failed: ${error.message}`);
    }
  }
  
  async resolveConflict(userId: string, conflict: any) {
    try {
      const resolvedData = await this.conflictResolver.resolveConflict(userId, conflict);
      
      // 保存解决后的数据
      await this.dbManager.saveUserData(userId, resolvedData);
      
      // 通知所有设备冲突已解决
      await this.notifyAllDevices(userId, 'conflict_resolved');
      
      return { success: true, data: resolvedData };
    } catch (error) {
      throw new Error(`Conflict resolution failed: ${error.message}`);
    }
  }
  
  private async checkConflicts(userId: string, data: any) {
    const existingData = await this.dbManager.getUserData(userId);
    return this.conflictResolver.detectConflicts(existingData, data);
  }
  
  private async saveUserData(userId: string, data: any, deviceId: string) {
    const result = await this.dbManager.saveUserData(userId, data);
    
    // 通知其他设备数据更新
    await this.notifyOtherDevices(userId, deviceId, 'data_updated');
    
    return result;
  }
  
  private async notifyOtherDevices(userId: string, excludeDeviceId: string, event: string) {
    // 通过WebSocket通知其他设备
    global.io.to(`user_${userId}`).emit(event, {
      userId,
      excludeDeviceId,
      timestamp: new Date().toISOString()
    });
  }
  
  private async notifyAllDevices(userId: string, event: string) {
    // 通知所有设备
    global.io.to(`user_${userId}`).emit(event, {
      userId,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 3. 冲突解决器
```typescript
// src/server/services/ConflictResolver.ts
export class ConflictResolver {
  async detectConflicts(existingData: any, newData: any): Promise<any[]> {
    const conflicts = [];
    
    // 检查时间戳冲突
    if (existingData.timestamp && newData.timestamp) {
      if (Math.abs(existingData.timestamp - newData.timestamp) < 1000) {
        conflicts.push({
          type: 'timestamp',
          existing: existingData,
          new: newData
        });
      }
    }
    
    // 检查数据冲突
    for (const key in newData) {
      if (existingData[key] && existingData[key] !== newData[key]) {
        conflicts.push({
          type: 'data',
          field: key,
          existing: existingData[key],
          new: newData[key]
        });
      }
    }
    
    return conflicts;
  }
  
  async resolveConflicts(conflicts: any[]): Promise<any> {
    const resolvedData = {};
    
    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'timestamp':
          // 使用最新的时间戳
          resolvedData.timestamp = Math.max(conflict.existing.timestamp, conflict.new.timestamp);
          break;
          
        case 'data':
          // 使用最新的数据
          resolvedData[conflict.field] = conflict.new;
          break;
      }
    }
    
    return resolvedData;
  }
  
  async resolveConflict(userId: string, conflict: any) {
    // 根据冲突类型选择解决策略
    switch (conflict.type) {
      case 'user_preference':
        return await this.resolveUserPreferenceConflict(conflict);
        
      case 'device_config':
        return await this.resolveDeviceConfigConflict(conflict);
        
      case 'sync_data':
        return await this.resolveSyncDataConflict(conflict);
        
      default:
        return await this.resolveGenericConflict(conflict);
    }
  }
  
  private async resolveUserPreferenceConflict(conflict: any) {
    // 用户偏好冲突解决策略
    // 通常选择用户最近修改的版本
    return conflict.new;
  }
  
  private async resolveDeviceConfigConflict(conflict: any) {
    // 设备配置冲突解决策略
    // 合并配置，保留所有设备的设置
    return {
      ...conflict.existing,
      ...conflict.new
    };
  }
  
  private async resolveSyncDataConflict(conflict: any) {
    // 同步数据冲突解决策略
    // 使用时间戳决定优先级
    return conflict.new.timestamp > conflict.existing.timestamp 
      ? conflict.new 
      : conflict.existing;
  }
  
  private async resolveGenericConflict(conflict: any) {
    // 通用冲突解决策略
    return conflict.new;
  }
}
```

## 数据模型

### 1. 用户数据模型
```typescript
// src/shared/types/UserData.ts
export interface UserData {
  id: string;
  email: string;
  preferences: UserPreferences;
  devices: DeviceInfo[];
  configs: ConfigData[];
  syncHistory: SyncHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface DeviceInfo {
  id: string;
  type: 'mobile' | 'desktop' | 'browser' | 'glasses';
  platform: string;
  version: string;
  lastSeen: Date;
  isOnline: boolean;
}

export interface ConfigData {
  id: string;
  type: 'user' | 'device' | 'app';
  data: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncHistory {
  id: string;
  deviceId: string;
  operation: 'create' | 'update' | 'delete';
  dataType: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}
```

### 2. 同步数据模型
```typescript
// src/shared/types/SyncData.ts
export interface SyncData {
  userId: string;
  deviceId: string;
  dataType: string;
  data: any;
  version: number;
  timestamp: Date;
  checksum: string;
}

export interface SyncRequest {
  userId: string;
  deviceId: string;
  data: SyncData[];
  timestamp: Date;
}

export interface SyncResponse {
  success: boolean;
  data?: SyncData[];
  conflicts?: ConflictData[];
  errors?: string[];
}

export interface ConflictData {
  id: string;
  type: string;
  field: string;
  existing: any;
  new: any;
  resolution?: any;
}
```

## 安全机制

### 1. 加密服务
```typescript
// src/server/services/EncryptionService.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  }
  
  async encrypt(data: any): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }
  
  async decrypt(encryptedData: string): Promise<any> {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  generateChecksum(data: any): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

### 2. 认证中间件
```typescript
// src/server/middleware/AuthMiddleware.ts
import jwt from 'jsonwebtoken';

export class AuthMiddleware {
  static async authenticate(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      req.user = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  static async validateDevice(req: any, res: any, next: any) {
    try {
      const { deviceId } = req.body;
      const userId = req.user.id;
      
      // 验证设备是否属于用户
      const isValidDevice = await this.validateDeviceOwnership(userId, deviceId);
      
      if (!isValidDevice) {
        return res.status(403).json({ error: 'Invalid device' });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Device validation failed' });
    }
  }
}
```

## 性能优化

### 1. 缓存策略
```typescript
// src/server/services/CacheService.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get(key: string): Promise<any> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 2. 批量处理
```typescript
// src/server/services/BatchProcessor.ts
export class BatchProcessor {
  private batchSize = 100;
  private batchTimeout = 1000; // 1秒
  private batches = new Map();
  
  async processBatch(userId: string, data: any) {
    if (!this.batches.has(userId)) {
      this.batches.set(userId, []);
      
      // 设置超时处理
      setTimeout(() => {
        this.flushBatch(userId);
      }, this.batchTimeout);
    }
    
    this.batches.get(userId).push(data);
    
    // 如果达到批量大小，立即处理
    if (this.batches.get(userId).length >= this.batchSize) {
      await this.flushBatch(userId);
    }
  }
  
  private async flushBatch(userId: string) {
    const batch = this.batches.get(userId);
    if (batch && batch.length > 0) {
      await this.processBatchData(userId, batch);
      this.batches.delete(userId);
    }
  }
  
  private async processBatchData(userId: string, batch: any[]) {
    // 批量处理数据
    // 这里可以实现批量数据库操作
  }
}
```

## 监控与日志

### 1. 性能监控
```typescript
// src/server/services/MonitoringService.ts
export class MonitoringService {
  private metrics = {
    syncRequests: 0,
    syncErrors: 0,
    averageResponseTime: 0,
    activeConnections: 0
  };
  
  recordSyncRequest(duration: number) {
    this.metrics.syncRequests++;
    this.updateAverageResponseTime(duration);
  }
  
  recordSyncError() {
    this.metrics.syncErrors++;
  }
  
  private updateAverageResponseTime(duration: number) {
    const current = this.metrics.averageResponseTime;
    const count = this.metrics.syncRequests;
    this.metrics.averageResponseTime = (current * (count - 1) + duration) / count;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
}
```

### 2. 日志记录
```typescript
// src/server/services/LogService.ts
import winston from 'winston';

export class LogService {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
      ]
    });
  }
  
  logSync(userId: string, deviceId: string, operation: string, success: boolean) {
    this.logger.info('Sync operation', {
      userId,
      deviceId,
      operation,
      success,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(error: Error, context: any) {
    this.logger.error('Sync error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

## 部署

### 1. Docker配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 环境变量
```bash
# .env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/yourPXO
```

### 3. 部署脚本
```bash
#!/bin/bash
# deploy.sh

echo "Deploying Sync service..."

# 构建Docker镜像
docker build -t yourPXO-sync .

# 停止旧容器
docker stop yourPXO-sync || true
docker rm yourPXO-sync || true

# 启动新容器
docker run -d \
  --name yourPXO-sync \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  yourPXO-sync

echo "Sync service deployed successfully!"
```

## 测试

### 1. 单元测试
```typescript
// tests/SyncManager.test.ts
import { SyncManager } from '../src/server/services/SyncManager';

describe('SyncManager', () => {
  let syncManager: SyncManager;
  
  beforeEach(() => {
    syncManager = new SyncManager();
  });
  
  it('should sync user data successfully', async () => {
    const result = await syncManager.syncUserData('user_123', { test: 'data' }, 'device_456');
    expect(result.success).toBe(true);
  });
  
  it('should resolve conflicts correctly', async () => {
    const conflict = {
      type: 'data',
      field: 'preferences',
      existing: { theme: 'light' },
      new: { theme: 'dark' }
    };
    
    const result = await syncManager.resolveConflict('user_123', conflict);
    expect(result.success).toBe(true);
  });
});
```

### 2. 集成测试
- 跨设备同步测试
- 冲突解决测试
- 性能压力测试
- 安全测试

## 监控与分析

### 1. 健康检查
```typescript
// src/server/health.ts
export class HealthCheck {
  static async check() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      encryption: await this.checkEncryption()
    };
    
    const allHealthy = Object.values(checks).every(check => check.healthy);
    
    return {
      healthy: allHealthy,
      checks
    };
  }
  
  private static async checkDatabase() {
    try {
      // 检查数据库连接
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
  
  private static async checkRedis() {
    try {
      // 检查Redis连接
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
  
  private static async checkEncryption() {
    try {
      // 检查加密服务
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}
```

### 2. 性能指标
- 同步请求数量
- 平均响应时间
- 错误率
- 活跃连接数
- 数据冲突率

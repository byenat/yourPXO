# Core 核心服务模块

## 概述

Core模块是yourPXO的核心服务层，负责管理用户配置、设备状态、数据同步等核心功能。

## 功能特性

### 用户管理
- 用户注册与认证
- 用户配置文件管理
- 权限控制
- 多设备绑定

### 设备管理
- 设备注册与识别
- 设备状态监控
- 设备间通信
- 离线状态处理

### 配置管理
- 统一配置系统
- 配置同步
- 配置版本控制
- 配置备份恢复

### 日志系统
- 跨平台日志记录
- 日志级别管理
- 日志分析
- 错误追踪

## 技术栈

- **语言**: TypeScript/JavaScript
- **框架**: Node.js
- **数据库**: SQLite (本地) / PostgreSQL (云端)
- **通信**: WebSocket / REST API
- **加密**: AES-256 / RSA

## 目录结构

```
Core/
├── src/
│   ├── user/           # 用户管理
│   ├── device/         # 设备管理
│   ├── config/         # 配置管理
│   ├── logger/         # 日志系统
│   ├── security/       # 安全模块
│   └── utils/          # 工具函数
├── tests/              # 测试文件
├── docs/               # 文档
└── package.json
```

## API接口

### 用户管理API
```typescript
// 用户注册
POST /api/user/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "deviceId": "device_123"
}

// 用户登录
POST /api/user/login
{
  "email": "user@example.com",
  "password": "secure_password"
}

// 获取用户配置
GET /api/user/config
Authorization: Bearer <token>
```

### 设备管理API
```typescript
// 设备注册
POST /api/device/register
{
  "deviceId": "device_123",
  "deviceType": "mobile",
  "deviceInfo": {...}
}

// 设备状态更新
PUT /api/device/status
{
  "deviceId": "device_123",
  "status": "online",
  "lastSeen": "2024-01-01T00:00:00Z"
}
```

## 与byenatOS集成

Core模块通过AI集成层与byenatOS进行交互：

```typescript
// 获取个性化配置
async function getPersonalizedConfig(userId: string) {
  const byenatOS = new ByenatOS({
    apiKey: process.env.BYENATOS_API_KEY
  });
  
  const personalizedPrompt = await byenatOS.getPersonalizedPrompt(userId);
  return {
    ...defaultConfig,
    personalizedPrompt
  };
}
```

## 部署说明

### 本地开发
```bash
cd Core
npm install
npm run dev
```

### 生产部署
```bash
npm run build
npm start
```

## 监控与维护

- 健康检查端点: `/health`
- 性能监控: Prometheus + Grafana
- 错误追踪: Sentry
- 日志聚合: ELK Stack

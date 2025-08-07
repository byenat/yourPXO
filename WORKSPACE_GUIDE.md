# yourPXO 工作空间使用指南

## 🎯 概述

这个工作空间展示了yourPXO如何集成byenatOS的AI能力，提供了一个完整的开发环境来测试和开发跨平台的个人体验优化应用。

## 🚀 快速开始

### 1. 启动工作空间

```bash
# 克隆项目
git clone https://github.com/byenat/yourPXO.git
cd yourPXO

# 启动工作空间
./start-workspace.sh
```

### 2. 手动启动

```bash
# 安装依赖
npm install

# 启动Core服务
cd Core
npm install
npm run dev
```

### 3. 测试byenatOS集成

```bash
# 运行测试客户端
cd Core
node test-client.js
```

## 📁 项目结构

```
yourPXO/
├── Core/                    # 核心服务模块
│   ├── src/
│   │   ├── services/       # 业务服务
│   │   │   ├── ByenatOSService.ts  # byenatOS集成
│   │   │   ├── UserService.ts      # 用户管理
│   │   │   ├── DeviceService.ts    # 设备管理
│   │   │   └── ConfigService.ts    # 配置管理
│   │   ├── database/       # 数据库层
│   │   ├── utils/          # 工具函数
│   │   └── index.ts        # 主入口
│   ├── test-client.js      # 测试客户端
│   └── package.json
├── AI/byenatOS/            # byenatOS集成模块
├── Mobile/                 # 移动端应用
├── Desktop/                # 桌面端应用
├── Browser/                # 浏览器插件
├── Glasses/                # 智能眼镜应用
├── Sync/                   # 数据同步服务
├── Shared/                 # 共享组件库
└── start-workspace.sh      # 启动脚本
```

## 🔧 byenatOS集成

### API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/ai/personalized-prompt` | POST | 获取个性化提示词 |
| `/api/ai/update-activity` | POST | 更新用户活动 |
| `/api/ai/analyze-content` | POST | 内容分析 |
| `/api/ai/focus-analysis` | POST | 专注度分析 |

### 使用示例

#### 1. 获取个性化提示词

```javascript
const response = await fetch('http://localhost:3001/api/ai/personalized-prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 'user_123',
    context: '我正在开发一个跨平台应用'
  })
});

const data = await response.json();
console.log('个性化提示词:', data.prompt);
```

#### 2. 更新用户活动

```javascript
const response = await fetch('http://localhost:3001/api/ai/update-activity', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 'user_123',
    activity: {
      type: 'development',
      duration: 120,
      description: '开发yourPXO应用',
      metadata: {
        project: 'yourPXO',
        platform: 'cross-platform'
      }
    }
  })
});
```

#### 3. 内容分析

```javascript
const response = await fetch('http://localhost:3001/api/ai/analyze-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 'user_123',
    content: 'yourPXO是一个跨平台的个人体验优化应用...'
  })
});

const data = await response.json();
console.log('分析结果:', data.analysis);
```

#### 4. 专注度分析

```javascript
const response = await fetch('http://localhost:3001/api/ai/focus-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 'user_123',
    activityData: {
      duration: 1800,
      breaks: 2,
      interruptions: 5,
      focusSessions: [
        { start: '2024-01-01T09:00:00Z', end: '2024-01-01T09:25:00Z' }
      ]
    }
  })
});

const data = await response.json();
console.log('专注度分数:', data.analysis.focusScore);
console.log('是否专注:', data.analysis.isFocused);
console.log('建议:', data.analysis.recommendations);
```

## 🔐 认证

所有API调用都需要JWT认证：

1. **注册用户**
```bash
curl -X POST http://localhost:3001/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

2. **登录获取token**
```bash
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **使用token调用API**
```bash
curl -X POST http://localhost:3001/api/ai/personalized-prompt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user_id",
    "context": "开发场景"
  }'
```

## 🛠️ 开发

### 环境配置

1. 复制环境变量文件：
```bash
cp Core/env.example Core/.env
```

2. 编辑配置：
```bash
# Core/.env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
BYENATOS_API_KEY=your-byenatos-api-key
BYENATOS_BASE_URL=https://api.byenatos.org
```

### 开发命令

```bash
# 启动开发服务器
npm run dev:core

# 构建项目
npm run build

# 运行测试
npm test

# 运行测试客户端
cd Core && node test-client.js
```

### 调试

1. **查看日志**
```bash
tail -f Core/logs/combined.log
```

2. **健康检查**
```bash
curl http://localhost:3001/health
```

3. **API文档**
访问 `http://localhost:3001/health` 查看服务状态

## 📊 监控

### 日志文件
- `Core/logs/error.log` - 错误日志
- `Core/logs/combined.log` - 完整日志

### 数据库
- SQLite数据库文件：`Core/yourPXO.db`

### 性能监控
- 请求响应时间
- API调用频率
- 错误率统计

## 🔄 数据流

```
用户操作 → yourPXO App → Core服务 → byenatOS API → 个性化响应
```

1. **用户操作** - 用户在移动端、桌面端或浏览器中进行操作
2. **Core服务** - 处理用户请求，管理用户数据和设备状态
3. **byenatOS集成** - 调用byenatOS API获取AI能力
4. **个性化响应** - 基于用户历史和偏好返回个性化结果

## 🎯 功能特性

### AI能力集成
- ✅ 个性化提示词生成
- ✅ 用户活动分析
- ✅ 内容智能分析
- ✅ 专注度检测
- ✅ 跨应用记忆管理

### 用户管理
- ✅ 用户注册和登录
- ✅ JWT认证
- ✅ 用户偏好管理
- ✅ 设备管理

### 数据同步
- ✅ 跨设备数据同步
- ✅ 配置版本管理
- ✅ 活动记录追踪

## 🚀 部署

### 开发环境
```bash
npm run dev:core
```

### 生产环境
```bash
npm run build
npm start
```

### Docker部署
```bash
docker build -t yourPXO .
docker run -p 3001:3001 yourPXO
```

## 🔧 故障排除

### 常见问题

1. **服务启动失败**
   - 检查端口3001是否被占用
   - 确认Node.js版本 >= 18
   - 检查环境变量配置

2. **byenatOS API调用失败**
   - 确认API密钥配置正确
   - 检查网络连接
   - 查看错误日志

3. **数据库错误**
   - 检查SQLite文件权限
   - 确认数据库文件路径

### 调试技巧

1. **启用详细日志**
```bash
export LOG_LEVEL=debug
```

2. **查看API响应**
```bash
curl -v http://localhost:3001/api/ai/personalized-prompt
```

3. **检查数据库**
```bash
sqlite3 Core/yourPXO.db ".tables"
```

## 📚 更多资源

- [byenatOS文档](https://github.com/byenat/byenatOS)
- [yourPXO架构文档](ARCHITECTURE.md)
- [API文档](Core/README.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个工作空间！

---

**🎉 现在您可以开始使用yourPXO与byenatOS的AI能力了！**

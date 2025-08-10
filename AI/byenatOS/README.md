# byenatOS AI集成模块

## 概述

byenatOS集成模块是yourPXO与[byenatOS](https://github.com/byenat/byenatOS) AI操作系统的桥梁，负责处理所有AI相关的功能调用和数据交互。

## 核心功能

### 🤖 AI能力集成
- **个性化提示词生成** - 基于用户行为和偏好生成个性化系统提示词
- **跨应用记忆管理** - 统一的个人记忆系统，支持跨应用数据共享
- **本地AI处理** - 利用byenatOS的本地AI能力，保护用户隐私
- **场景化优化** - 根据用户当前场景提供智能优化建议

### 🔄 数据同步
- **实时同步** - 与byenatOS的实时数据同步
- **离线支持** - 本地缓存机制，支持离线使用
- **冲突解决** - 智能数据冲突检测和解决
- **安全传输** - 端到端加密的数据传输

## 技术架构

```
yourPXO AI Layer
├── byenatOS SDK Wrapper    # SDK封装层
├── API Manager            # API管理
├── Local AI Processor     # 本地AI处理
├── Memory Manager         # 记忆管理
└── Privacy Controller     # 隐私控制
```

## 集成方式

### 1. SDK集成

```typescript
import { ByenatOS } from '@byenatos/sdk';

class ByenatOSIntegration {
  private byenatOS: ByenatOS;
  
  constructor() {
    this.byenatOS = new ByenatOS({
      apiKey: process.env.BYENATOS_API_KEY,
      localMode: true,
      privacyLevel: 'high'
    });
  }
  
  // 获取个性化提示词
  async getPersonalizedPrompt(userId: string, context?: string) {
    return await this.byenatOS.getPersonalizedPrompt({
      userId,
      context,
      includeMemory: true
    });
  }
  
  // 更新用户记忆
  async updateUserMemory(userId: string, data: any) {
    return await this.byenatOS.updateMemory({
      userId,
      data,
      source: 'yourPXO'
    });
  }
}
```

### 2. API调用示例

```typescript
// 场景化AI助手
async function getContextualAssistant(userId: string, context: string) {
  const byenatOS = new ByenatOS({
    apiKey: process.env.BYENATOS_API_KEY
  });
  
  const personalizedPrompt = await byenatOS.getPersonalizedPrompt({
    userId,
    context,
    scenario: 'work',
    includeHistory: true
  });
  
  return {
    systemPrompt: personalizedPrompt,
    context: context,
    timestamp: new Date().toISOString()
  };
}

// 专注模式检测
async function detectFocusMode(userId: string, activityData: any) {
  const byenatOS = new ByenatOS({
    apiKey: process.env.BYENATOS_API_KEY
  });
  
  const focusAnalysis = await byenatOS.analyzeActivity({
    userId,
    activity: activityData,
    mode: 'focus_detection'
  });
  
  return {
    isFocused: focusAnalysis.focusScore > 0.8,
    focusScore: focusAnalysis.focusScore,
    recommendations: focusAnalysis.recommendations
  };
}
```

## 功能映射表

| yourPXO功能 | byenatOS能力 | 集成方式 | 隐私级别 |
|-------------|-------------|----------|----------|
| 个人配置管理 | PSP系统 | API调用 | 本地优先 |
| 场景化优化 | 场景记忆 | 本地存储 | 完全本地 |
| 专注模式 | 专注检测 | 实时分析 | 本地处理 |
| 跨设备同步 | 统一记忆 | 云端同步 | 加密传输 |
| 智能推荐 | 行为分析 | 本地模型 | 本地优先 |

## 隐私保护

### 数据本地化
- 优先使用本地AI模型
- 敏感数据不上传云端
- yourPXO → byenatOS 传输阶段不做 PII 脱敏；对在线大模型的调用中由 byenatOS 执行敏感信息隔离和过滤
- 本地缓存机制
- 用户数据控制权

### 安全措施
- API密钥加密存储
- 请求签名验证
- 数据脱敏处理
- 传输加密

## HiNATA 支持与边界

- **Schema定义**: 提供`HiNATASchema`类型与`ValidateHiNATA`校验工具（通过 byenatOS SDK 暴露）。
- **本地算子**: 提供无状态的本地模型算子，用于在设备侧对内容进行丰富：
  - `SuggestTags`（标签建议）
  - `RecommendHighlights`（重点高亮建议）
  - `Summarize`（摘要与要点）
  - `Embed`（文本向量）
  - `ExtractEntities`（实体识别）
  - `ClusterTopics`（主题聚类）
- **职责边界**: 不处理用户标识与用户态逻辑；不持久化；不直接与用户交互。yourPXO 负责信息摄入、`MapToHiNATA`、持久化与用户确认流程。

### TypeScript 接口（示例）

```ts
export interface HiNATASchemaTools {
  ValidateHiNATA(input: any): Promise<{ Valid: boolean; Errors?: string[] }>;
}

export interface LocalAIOperators {
  SuggestTags(input: { Content: string; TopK?: number }): Promise<{ Tags: Array<{ Tag: string; Score: number }> }>;
  RecommendHighlights(input: { Content: string; Language?: string; MaxHighlights?: number }): Promise<{ Highlights: Array<{ Start: number; End: number; Confidence: number; Reason: string }> }>;
  Summarize(input: { Content: string; MaxLength?: number }): Promise<{ Summary: string; KeyPoints: string[] }>;
  Embed(input: { Content: string; Model?: string }): Promise<{ Vector: number[]; Dim: number }>;
}
```

> EN: This module exposes HiNATA schema and local AI operators only. User data handling, mapping, persistence and UX are owned by yourPXO.

## 配置选项

```typescript
interface ByenatOSConfig {
  apiKey: string;
  localMode: boolean;
  privacyLevel: 'low' | 'medium' | 'high';
  cacheEnabled: boolean;
  syncInterval: number;
  maxLocalMemory: number;
}
```

## 错误处理

```typescript
class ByenatOSError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ByenatOSError';
  }
}

// 错误处理示例
try {
  const result = await byenatOS.getPersonalizedPrompt(userId);
  return result;
} catch (error) {
  if (error instanceof ByenatOSError && error.retryable) {
    // 重试逻辑
    return await retryOperation();
  }
  // 降级到本地模式
  return await getLocalFallback();
}
```

## 性能优化

### 缓存策略
- 本地缓存个性化提示词
- 智能缓存失效机制
- 预加载常用数据
- 压缩传输数据

### 并发控制
- 请求限流
- 连接池管理
- 超时处理
- 重试机制

## 监控与日志

```typescript
// 性能监控
const metrics = {
  apiCallLatency: [],
  cacheHitRate: 0,
  errorRate: 0,
  memoryUsage: 0
};

// 日志记录
logger.info('ByenatOS API call', {
  userId,
  operation: 'getPersonalizedPrompt',
  latency: Date.now() - startTime,
  success: true
});
```

## 部署说明

### 环境变量
```bash
BYENATOS_API_KEY=your_api_key
BYENATOS_LOCAL_MODE=true
BYENATOS_PRIVACY_LEVEL=high
BYENATOS_CACHE_ENABLED=true
```

### 依赖安装
```bash
npm install @byenatos/sdk
npm install @byenatos/local-ai
```

## 测试

```typescript
// 单元测试
describe('ByenatOS Integration', () => {
  it('should get personalized prompt', async () => {
    const integration = new ByenatOSIntegration();
    const prompt = await integration.getPersonalizedPrompt('user_123');
    expect(prompt).toBeDefined();
  });
  
  it('should handle offline mode', async () => {
    // 离线模式测试
  });
});
```

## 未来规划

- [ ] 支持更多本地AI模型
- [ ] 增强隐私保护机制
- [ ] 优化跨平台同步性能
- [ ] 添加更多场景化功能

# yourPXO 系统架构

## 信息摄入系统架构

### 核心信息源模块

#### 1. 个人日记记录模块
```
Core/src/services/DiaryService.ts
├── 文字输入处理
├── 语音转文字 (Speech-to-Text)
├── 情感分析
├── 主题提取
└── 时间线整理
```

#### 2. ReadItLater 集成模块
```
Core/src/services/ReadItLaterService.ts
├── Pocket API 集成
├── Instapaper API 集成
├── 内容抓取
├── 阅读进度跟踪
└── 偏好分析
```

#### 3. 浏览器插件模块
```
Browser/
├── src/
│   ├── content-script.js    # 页面内容处理
│   ├── background.js        # 后台服务
│   ├── popup.js            # 插件界面
│   └── utils/
│       ├── annotation.js    # 标注功能
│       ├── highlight.js     # 高亮功能
│       └── capture.js       # 内容捕获
```

#### 4. 社交媒体收集模块
```
Core/src/services/SocialMediaService.ts
├── 微博API集成
├── Twitter API集成
├── 微信API集成
├── 内容抓取引擎
└── 上下文分析
```

#### 5. 社交软件转发模块
```
Core/src/services/ForwardService.ts
├── 微信转发处理
├── Telegram Bot集成
├── WhatsApp API集成
├── 内容解析
└── 来源追踪
```

#### 6. 文档解析模块
```
Core/src/services/DocumentService.ts
├── EPUB解析器
├── PDF解析器
├── OCR文字识别
├── 章节分析
└── 知识图谱构建
```

#### 7. 智能眼镜模块
```
Glasses/
├── src/
│   ├── camera/
│   │   ├── image-capture.js
│   │   ├── scene-analysis.js
│   │   └── ocr-processing.js
│   ├── ar/
│   │   ├── overlay.js
│   │   └── gesture-recognition.js
│   └── communication/
│       ├── data-sync.js
│       └── real-time-processing.js
```

### 数据处理管道

#### 信息摄入流程
```
原始信息 → 内容解析 → 智能分类 → 知识关联 → 个人prompt生成
```

#### 数据存储架构
```
Database/
├── user_profiles/           # 用户档案
├── content_collections/     # 内容集合
├── knowledge_graph/         # 知识图谱
├── personal_prompts/        # 个人prompt
└── ai_interactions/         # AI交互记录
```

### AI集成架构

#### byenatOS集成
```
AI/byenatOS/
├── sdk/
│   ├── local-ai.js         # 本地AI处理
│   ├── prompt-generation.js # prompt生成
│   └── memory-system.js    # 记忆系统
├── models/
│   ├── content-analysis.js  # 内容分析模型
│   ├── user-profiling.js    # 用户画像模型
│   └── knowledge-graph.js   # 知识图谱模型
```

#### 外部大模型调用
```
Core/src/services/ExternalAIService.ts
├── OpenAI API集成
├── Claude API集成
├── 本地模型调用
├── 结果聚合
└── 响应优化
```

### 跨平台同步架构

#### 数据同步服务
```
Sync/
├── src/
│   ├── websocket-server.js  # 实时同步
│   ├── rest-api.js         # REST API
│   ├── conflict-resolution.js # 冲突解决
│   └── encryption.js       # 数据加密
```

#### 设备间通信
```
Shared/
├── protocols/
│   ├── data-format.js      # 数据格式标准
│   ├── sync-protocol.js    # 同步协议
│   └── api-standards.js    # API标准
```

### 隐私保护架构

#### 数据安全
- 本地优先处理
- 端到端加密
- 用户数据控制
- 透明数据处理

#### 权限管理
- 细粒度权限控制
- 数据访问审计
- 用户同意机制
- 数据删除权

## 技术栈详情

### 前端技术
- **移动端**: React Native + TypeScript
- **桌面端**: Electron + React
- **浏览器**: Chrome Extension API
- **智能眼镜**: WebXR + AR.js

### 后端技术
- **核心服务**: Node.js + TypeScript
- **AI处理**: Python + TensorFlow
- **数据库**: PostgreSQL + Redis
- **消息队列**: RabbitMQ

### AI技术
- **本地AI**: byenatOS SDK
- **外部AI**: OpenAI GPT, Claude
- **图像处理**: TensorFlow.js
- **语音处理**: Web Speech API

### 部署架构
- **容器化**: Docker + Kubernetes
- **云服务**: AWS/Azure/GCP
- **CDN**: CloudFlare
- **监控**: Prometheus + Grafana

## HiNATA 数据流与职责边界（yourPXO ↔ byenatOS）

- **边界原则**
  - 用户识别、授权、偏好、持久化、审计：仅在`yourPXO`侧。
  - `byenatOS`仅提供`HiNATASchema`与本地模型算子，保持无状态、不接触用户标识；对在线大模型的调用进行敏感信息隔离与保护。

- **流程总览**
 1. yourPXO Ingest: 7大信息源采集 → 预处理(清洗/格式化；不对传往`byenatOS`的内容做 PII 脱敏)
  2. yourPXO Map: `MapToHiNATA(raw) → PartialHiNATA`（基于SDK的类型定义，但实现与执行在yourPXO）
  3. yourPXO Enrich via byenatOS: 调用本地算子`SuggestTags`/`RecommendHighlights`/`Summarize`/`Embed`/`ExtractEntities`/`ClusterTopics`
  4. yourPXO Validate: 使用`ValidateHiNATA`进行结构与约束校验，生成`HiNATARecord`与`QualityScore`
  5. yourPXO Persist & HIL: 版本化落库，向用户呈现“标签/高亮”建议，用户确认后合并；记录审计

- **接口契约（示例）**

```ts
interface HiNATASchemaTools {
  ValidateHiNATA(input: any): Promise<{ Valid: boolean; Errors?: string[] }>;
}

interface LocalAIOperators {
  SuggestTags(input: { Content: string; TopK?: number }): Promise<{ Tags: Array<{ Tag: string; Score: number }> }>;
  RecommendHighlights(input: { Content: string; Language?: string; MaxHighlights?: number }): Promise<{ Highlights: Array<{ Start: number; End: number; Confidence: number; Reason: string }> }>;
  Summarize(input: { Content: string; MaxLength?: number }): Promise<{ Summary: string; KeyPoints: string[] }>;
  Embed(input: { Content: string; Model?: string }): Promise<{ Vector: number[]; Dim: number }>;
}
```

- **隐私与安全**
  - yourPXO对`byenatOS`的调用不包含`UserId`等直接标识，仅传`Content`及必要参数。
  - 模型推理在设备本地完成；如需远程资源，需yourPXO端明示并经用户授权。
  - 全程可观测：在yourPXO记录来源、算子、版本、质量分与用户决策。

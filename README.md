# yourPXO

个人体验优化系统 (Personal Experience Optimization)

## 项目简介

yourPXO是一个跨平台的个人AI助手系统，从**个人项目经理(PMO)**逐步演进为**首席幕僚长(PSO)**。通过AI的助力，系统持续记录、理解和整理用户接触的信息，生成AI友好的个人prompt，并调用外部大模型来满足用户需求。随着对用户理解的不断深入，系统从被动管理转向主动参谋，成为用户的"数字首席幕僚"。

## 开发优先级

### 🎯 第一阶段：核心平台 (优先实现)
- **📱 手机端应用** - iOS/Android原生应用
- **🌐 浏览器插件** - Chrome/Firefox/Safari扩展

### 🔄 第二阶段：扩展平台
- **💻 桌面应用** - Windows/macOS/Linux桌面客户端
- **👓 智能眼镜** - AR/VR设备应用

## 核心定位

### 🎯 PMO → PSO 演进路径

**PMO阶段 (Personal Management Officer)**
- 记录用户接触的所有信息
- 理解用户的信息处理模式
- 整理和分类用户信息
- 生成基础的个人AI prompt
- 被动响应用户需求

**PSO阶段 (Principal Staff Officer)**  
- 基于深度用户画像提供主动建议
- 预测用户需求和潜在问题
- 提供决策支持和战略建议
- 成为用户的"数字首席幕僚"
- 主动参谋，深度理解用户真实需求

### 🔄 持续的信息处理循环

无论PMO还是PSO阶段，系统都在执行相同的信息处理循环：
1. **信息记录** - 捕获用户接触的所有信息
2. **信息理解** - 分析用户的信息处理偏好和模式
3. **信息整理** - 结构化存储和分类信息
4. **需求匹配** - 基于理解程度提供相应服务

**关键差异**：随着信息积累，系统对用户的理解从平面转向立体，服务从工具性转向参谋性。

## 信息摄入方式

### 📝 核心信息源

系统通过以下7种方式收集用户信息，构建完整的个人知识库：

#### 1. 个人日记记录
- **输入方式**：文字输入、语音转文字
- **内容类型**：日常记录、思考、感受、计划
- **处理方式**：情感分析、主题提取、时间线整理

#### 2. ReadItLater 阅读管理
- **工具集成**：Pocket、Instapaper等阅读稍后服务
- **内容类型**：文章、博客、新闻、技术文档
- **处理方式**：内容摘要、关键词提取、阅读偏好分析

#### 3. 浏览器插件记录
- **插件功能**：在浏览网页时直接记录和标注
- **内容类型**：网页内容、在线文章、技术资料
- **处理方式**：实时标注、重点提取、关联分析

#### 4. 社交媒体@收集
- **收集方式**：在社交平台评论中@指定账号
- **平台支持**：微博、Twitter、微信等主流平台
- **处理方式**：内容抓取、上下文分析、兴趣标签

#### 5. 社交软件转发收集
- **收集方式**：将感兴趣内容转发给指定账号
- **平台支持**：微信、Telegram、WhatsApp等
- **处理方式**：内容解析、来源追踪、偏好分析

#### 6. 文档上传解析
- **支持格式**：EPUB电子书、PDF文档
- **内容类型**：书籍、报告、论文、手册
- **处理方式**：OCR文字识别、章节分析、知识图谱构建

#### 7. 智能眼镜拍照
- **设备支持**：AR/VR眼镜、智能眼镜
- **内容类型**：视觉信息、场景记录、文档拍照
- **处理方式**：图像识别、OCR文字提取、场景理解

### 🔄 信息处理流程

1. **信息摄入** - 通过7种方式收集原始信息
2. **内容解析** - 提取文字、图像、结构化数据
3. **智能分类** - 基于内容类型和用户偏好自动分类
4. **知识关联** - 建立信息间的关联关系
5. **个人prompt生成** - 基于积累信息生成AI友好的prompt

## 核心特性

### 🚀 跨平台支持
- **移动端应用** - iOS/Android原生应用
- **桌面应用** - Windows/macOS/Linux桌面客户端
- **浏览器插件** - Chrome/Firefox/Safari扩展
- **智能眼镜** - AR/VR设备应用

### 🤖 AI能力集成
- 集成[byenatOS](https://github.com/byenat/byenatOS) AI操作系统
- 个人系统提示词管理 (PSP - Personal System Prompt)
- 动态个人prompt生成
- 外部大模型调用能力
- 用户信任建立机制

### 🔄 数据同步
- 跨设备数据同步
- 统一用户配置文件
- 实时状态同步

## 技术架构

```
yourPXO
├── Mobile/          # 移动端应用 (优先实现)
├── Desktop/         # 桌面应用
├── Browser/         # 浏览器插件 (优先实现)
├── Glasses/         # 智能眼镜应用
├── Core/            # 核心共享逻辑
├── AI/              # AI集成层
│   └── byenatOS/    # byenatOS集成
├── Sync/            # 数据同步服务
├── Shared/          # 共享组件
└── Apps/            # 并列的独立应用（与 yourPXO 并列管理）
    ├── ZenRead/     # Read-It-Later 独立应用（yourPXO 已内置同等能力）
    └── ZenNote/     # Daily Note 独立应用（yourPXO 已内置同等能力）
```

## 与byenatOS的集成

yourPXO通过以下方式集成byenatOS：

1. **API集成** - 使用byenatOS SDK
2. **本地AI处理** - 利用byenatOS的本地AI能力
3. **个人prompt生成** - 基于用户信息动态生成AI友好的prompt
4. **隐私保护** - 本地数据处理

### HiNATA 分工与流程（yourPXO ↔ byenatOS）

- **职责原则 / Principle**: 所有涉及用户识别、偏好、存储、权限与交互的一切均由`yourPXO`负责；`byenatOS`仅提供本地模型推理与`HiNATASchema`类型/校验工具，不直接处理任何用户实体信息。

- **yourPXO职责 / yourPXO Responsibilities**
  - 信息摄入与预处理（格式归一；不在 yourPXO→byenatOS 传输前进行 PII 脱敏）
  - 依据`HiNATASchema`在本地完成原始信息→`HiNATARecord`映射
  - 编排调用本地模型进行丰富（标签建议、重点高亮、摘要、嵌入等）
  - 统一存储、版本化、用户确认（Human-in-the-loop）与审计
  - 不向`byenatOS`泄露用户标识，仅以无状态请求传入内容片段

- **byenatOS职责 / byenatOS Responsibilities**
  - 提供`HiNATASchema`类型定义与`ValidateHiNATA`校验工具（SDK）
  - 提供本地模型算子：`SuggestTags`、`RecommendHighlights`、`Summarize`、`Embed`、`ExtractEntities`、`ClusterTopics` 等
  - 提供质量评分与置信度指标；不持久化、不关联用户

- **典型接口（示例） / Sample Interfaces**

```ts
type HiNATARecord = {
  Id: string;
  Source: string;
  Content: { Text: string; Language?: string };
  Tags?: string[];
  Highlights?: Array<{ Start: number; End: number; Reason: string }>;
  Metadata?: Record<string, any>;
};

interface HiNATAEnrichmentRequest {
  Content: string;
  Language?: string;
  MaxHighlights?: number;
}

interface ByenatOSLocalAI {
  SuggestTags(input: { Content: string; TopK?: number }): Promise<{ Tags: Array<{ Tag: string; Score: number }> }>;
  RecommendHighlights(input: HiNATAEnrichmentRequest): Promise<{ Highlights: Array<{ Start: number; End: number; Confidence: number; Reason: string }> }>;
  Summarize(input: { Content: string; MaxLength?: number }): Promise<{ Summary: string; KeyPoints: string[] }>;
  Embed(input: { Content: string; Model?: string }): Promise<{ Vector: number[]; Dim: number }>;
  ValidateHiNATA(input: any): Promise<{ Valid: boolean; Errors?: string[] }>;
}
```

- **数据流 / Data Flow**
  1. yourPXO: Ingest → Preprocess(清洗/归一，不做 PII 脱敏) → `MapToHiNATA` 生成`PartialHiNATA`。
  2. yourPXO: 调用`byenatOS.LocalAI`进行丰富：`SuggestTags`、`RecommendHighlights`、`Summarize`、`Embed`。
  3. yourPXO: 使用`ValidateHiNATA`校验为合规`HiNATARecord`，计算`QualityScore`。
  4. yourPXO: 落库与版本化；将标签/高亮作为“建议”呈现，用户确认后合并。
  5. yourPXO: 全程不传用户标识给`byenatOS`；敏感信息与在线大模型的隔离由`byenatOS`在其侧处理；所有用户态、审计与权限均在yourPXO侧。

- EN: yourPXO owns user data, mapping and persistence; byenatOS provides schema and on-device AI operators only.

### 多 App 工作空间与共享策略
- 同一账号下，`yourPXO`、`ZenRead`、`ZenNote` 等具备 `byenatOS` 能力的应用默认共享唯一 HiNATA 与 PSP（`Scope=account`）。
- 支持 `Scope=app`（App 级 Overlay 合成）：在账号级 PSP 之上叠加应用专属偏好（如输出风格、长度限制、界面约束）。
- `yourPXO` 已内置 ZenRead（Read-It-Later）与 ZenNote（Daily Note）能力；分体 App 作为专业入口与并列产品，满足独立使用需求但共享同一用户知识与个性化策略。

## 开发状态

项目正在初始开发阶段，优先实现手机端和浏览器插件。

## 技术栈

- **前端框架**: React Native / Electron / Web Extension
- **后端服务**: Node.js / Python
- **AI集成**: byenatOS SDK + 外部大模型API
- **数据同步**: WebSocket / REST API
- **数据库**: SQLite / PostgreSQL

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证

MIT License

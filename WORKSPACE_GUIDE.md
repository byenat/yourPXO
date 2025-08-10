# byenat 工作空间指南

## 项目定位

yourPXO是一个从**个人项目经理(PMO)**演进为**首席幕僚长(PSO)**的个人AI助手系统，通过7种信息摄入方式构建用户的个人知识库，实现从工具性到参谋性的升级。

## 开发优先级

### 🎯 第一阶段：核心平台 (当前重点)
- **📱 手机端应用** - iOS/Android原生应用
- **🌐 浏览器插件** - Chrome/Firefox/Safari扩展

### 🔄 第二阶段：扩展平台
- **💻 桌面应用** - Windows/macOS/Linux桌面客户端
- **👓 智能眼镜** - AR/VR设备应用

## 信息摄入方式

### 7个核心信息源

1. **个人日记记录** - 文字/语音输入，情感分析
2. **ReadItLater集成** - Pocket/Instapaper API集成
3. **浏览器插件记录** - 实时标注和内容捕获
4. **社交媒体@收集** - 多平台API集成
5. **社交软件转发收集** - Bot集成和内容解析
6. **文档上传解析** - EPUB/PDF OCR和章节分析
7. **智能眼镜拍照** - 图像识别和场景理解

## 技术架构概览

### 核心模块（更新：Workspace 多App 并列管理）
```
Core/                    # 核心共享逻辑
├── src/
│   ├── services/       # 服务层
│   ├── database/       # 数据层
│   └── utils/          # 工具层

Mobile/                  # 移动端应用 (优先实现)
├── src/
│   ├── modules/        # 功能模块
│   ├── services/       # API服务
│   └── ai/            # AI集成

Browser/                 # 浏览器插件 (优先实现)
├── src/
│   ├── content-script.js
│   ├── background.js
│   ├── popup.js
│   └── utils/

AI/                     # AI集成层
├── byenatOS/          # byenatOS集成接口
└── byenatOS-core/     # byenatOS完整源码 (git submodule)

Sync/                   # 数据同步服务
└── src/

Shared/                 # 共享组件
└── protocols/

Apps/                   # 并列的独立应用（与 yourPXO 并列管理）
├── ZenRead/            # Read-It-Later 独立应用（yourPXO 已内置同等能力）
│   └── PRD.md
└── ZenNote/            # Daily Note 独立应用（yourPXO 已内置同等能力）
    └── PRD.md
```

## 开发计划

### 手机端开发计划

#### 第一阶段：基础功能 (2-3周)
- [ ] 项目初始化和基础架构
- [ ] 用户认证和配置
- [ ] 基础UI组件库
- [ ] 本地数据存储

#### 第二阶段：核心功能 (3-4周)
- [ ] 日记记录功能
- [ ] 文档上传解析
- [ ] 基础AI对话
- [ ] 数据同步

#### 第三阶段：高级功能 (4-5周)
- [ ] 社交媒体收集
- [ ] 高级AI功能
- [ ] 知识图谱
- [ ] 个性化推荐

### 浏览器插件开发计划

#### 第一阶段：基础功能 (2-3周)
- [ ] 插件基础架构
- [ ] 内容抓取功能
- [ ] 本地存储
- [ ] 基础UI界面

#### 第二阶段：核心功能 (3-4周)
- [ ] 标注功能
- [ ] AI分析集成
- [ ] 数据同步
- [ ] 用户设置

#### 第三阶段：高级功能 (4-5周)
- [ ] 高级AI分析
- [ ] 知识图谱
- [ ] 个性化推荐
- [ ] 数据导出

## 技术栈选择

### 手机端
- **框架**: React Native + TypeScript
- **状态管理**: Redux Toolkit
- **导航**: React Navigation 6
- **UI组件**: React Native Elements
- **AI集成**: byenatOS SDK + 外部大模型API

### 浏览器插件
- **框架**: 原生JavaScript + TypeScript
- **浏览器API**: Chrome Extension API
- **存储**: IndexedDB + Chrome Storage
- **AI集成**: byenatOS SDK + 外部大模型API

### 后端服务
- **核心服务**: Node.js + TypeScript
- **AI处理**: Python + TensorFlow
- **数据库**: PostgreSQL + Redis
- **消息队列**: RabbitMQ

## 关键决策点

### 1. AI模型选择
- **本地AI**: byenatOS (隐私保护)
- **外部AI**: OpenAI GPT, Claude (能力扩展)
- **智能选择**: 根据内容类型和复杂度自动选择

### 2. 数据同步策略
- **实时同步**: WebSocket连接
- **离线支持**: 本地优先，联网同步
- **冲突解决**: 基于时间戳的智能合并

### 3. 隐私保护
- **本地处理**: 敏感数据本地处理
- **端到端加密**: 数据传输加密
- **用户控制**: 完全的用户数据控制权

## HiNATA 集成开发

### 🎯 byenatOS 集成优势
通过 git 子模块集成 byenatOS，获得以下优势：
- **直接访问**: 完整的 HiNATA 定义和实现代码
- **实时同步**: byenatOS 更新可直接获取
- **开发效率**: 避免文档不一致问题
- **统一工作空间**: 一个项目管理两个仓库

### 📁 新的工作空间结构
```
yourPXO/
├── AI/
│   ├── byenatOS/          # yourPXO 的 byenatOS 集成接口
│   └── byenatOS-core/     # byenatOS 完整源码 (git submodule)
│       ├── Documentation/
│       │   └── zh/APIs/
│       │       ├── HiNATADefinition.md      # HiNATA 权威定义
│       │       ├── HiNATAFormat.md          # HiNATA 格式规范
│       │       └── HiNATAProcessing.md      # HiNATA 处理流程
│       └── Kernel/Core/
│           └── HiNATAProcessor.py           # HiNATA 处理器实现
├── Core/src/services/
│   └── HiNATAService.ts                     # yourPXO 的 HiNATA 服务
├── scripts/
│   ├── setup-workspace.sh                  # 工作空间设置脚本
│   └── validate-hinata-integration.ts      # HiNATA 集成验证
└── workspace.config.json                   # 工作空间配置

Apps/
├── ZenRead/PRD.md                          # RIL 独立App PRD（与 yourPXO 并列）
└── ZenNote/PRD.md                          # 日记独立App PRD（与 yourPXO 并列）
```

### 🧩 多 App 共享策略（byenatOS 支持）
- 同账号登录的多个具备 `byenatOS` 能力的 App（如 `yourPXO`、`ZenRead`、`ZenNote`）默认共享唯一的 HiNATA 库与 PSP（Scope=account）。
- 可选 App 级 Overlay（Scope=app）：在账号级 PSP 之上叠加 App 特定的偏好与约束（如输出风格、摘要长度、UI 限制）。
- 数据流：Apps → yourPXO（存储/审计）→ byenatOS（本地算子增强/校验/统一外部 LLM 编排，无用户标识）→ 结果回写为 HiNATA/QnA，驱动 PSP 迭代。

### 🚀 快速开始 (更新)
1. **工作空间设置**
   ```bash
   # 运行自动设置脚本
   ./scripts/setup-workspace.sh
   
   # 或手动设置
   git submodule update --init --recursive
   cd Core && npm install
   cd ../AI/byenatOS-core && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
   ```

2. **HiNATA 开发流程**
   ```bash
   # 验证 HiNATA 集成
   npx ts-node scripts/validate-hinata-integration.ts
   
   # 启动开发环境
   ./scripts/dev.sh
   ```

3. **VSCode 开发**
   ```bash
# 打开 VSCode 工作空间
code byenat.code-workspace
   ```

## 下一步行动

### 立即开始 (本周) - 更新
1. **HiNATA 集成验证**
   - 运行 `./scripts/setup-workspace.sh` 设置环境
   - 验证 HiNATA 格式一致性
   - 确认数据流和接口正确性

2. **核心 HiNATA 服务**
   - 实现 `MapToHiNATA` 数据映射
   - 集成 byenatOS 本地 AI 算子
   - 开发用户确认和合并流程

### 下周计划
1. **手机端基础功能**
   - 用户界面框架
   - 日记记录功能
   - 本地数据存储

2. **浏览器插件基础**
   - 插件架构搭建
   - 内容抓取功能
   - 基础UI界面

### 本月目标
1. **完成第一阶段功能**
   - 手机端基础功能完成
   - 浏览器插件基础功能完成
   - 数据同步机制实现

2. **开始第二阶段开发**
   - AI功能集成
   - 高级内容处理
   - 用户体验优化

## 技术挑战与解决方案

### 1. 跨平台兼容性
- **挑战**: iOS/Android平台差异
- **解决方案**: React Native + 平台特定代码

### 2. AI集成复杂性
- **挑战**: 多模型协调和选择
- **解决方案**: 智能模型选择器 + 统一API

### 3. 数据同步
- **挑战**: 大文件同步和冲突解决
- **解决方案**: 增量同步 + 智能冲突解决

### 4. 隐私保护
- **挑战**: 本地处理与云端能力平衡
- **解决方案**: 本地优先 + 选择性云端处理

## 质量保证

### 测试策略
- **单元测试**: 核心业务逻辑
- **集成测试**: 端到端功能测试
- **用户测试**: 用户体验验证

### 性能监控
- **应用性能**: 响应时间和内存使用
- **AI性能**: 处理速度和准确性
- **同步性能**: 数据同步效率

### 安全审计
- **数据安全**: 加密和访问控制
- **隐私保护**: 用户数据保护
- **API安全**: 外部API调用安全

## 团队协作

### 开发流程
1. **需求分析** - 明确功能需求
2. **技术设计** - 架构和技术方案
3. **开发实现** - 代码编写和测试
4. **集成测试** - 功能集成验证
5. **用户测试** - 用户体验验证
6. **发布部署** - 生产环境部署

### 代码规范
- **命名规范**: PascalCase/UpperCamelCase
- **代码风格**: ESLint + Prettier
- **提交规范**: Conventional Commits
- **文档要求**: 代码注释 + API文档

### 版本管理
- **分支策略**: Git Flow
- **发布策略**: 语义化版本
- **回滚机制**: 快速回滚能力

## 成功指标

### 技术指标
- **性能**: 响应时间 < 2秒
- **稳定性**: 崩溃率 < 0.1%
- **兼容性**: 支持主流设备和浏览器

### 用户体验指标
- **易用性**: 新用户上手时间 < 5分钟
- **满意度**: 用户满意度 > 4.5/5
- **留存率**: 30天留存率 > 70%

### 业务指标
- **信息收集**: 平均每日收集信息 > 10条
- **AI使用**: AI功能使用率 > 60%
- **用户增长**: 月活跃用户增长率 > 20%

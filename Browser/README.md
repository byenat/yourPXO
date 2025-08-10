# Browser 浏览器插件

## 项目概述

yourPXO浏览器插件是系统的核心信息摄入入口，支持Chrome、Firefox、Safari等主流浏览器，为用户提供便捷的网页内容收集、标注和分析功能。

## 核心功能

### 📝 内容收集功能

#### 1. 网页内容捕获
- **全文抓取**：一键保存完整网页内容
- **智能提取**：自动识别文章主体内容
- **元数据收集**：标题、作者、发布时间等
- **图片保存**：自动下载和保存网页图片

#### 2. 实时标注功能
- **文本高亮**：选择文本进行高亮标注
- **笔记添加**：在网页上添加个人笔记
- **标签管理**：为内容添加自定义标签
- **重点标记**：标记重要段落和观点

#### 3. 阅读进度跟踪
- **阅读位置**：记录用户阅读进度
- **阅读时间**：统计页面停留时间
- **阅读偏好**：分析用户阅读习惯
- **阅读历史**：保存阅读历史记录

### 🤖 AI分析功能

#### 1. 内容智能分析
- **主题识别**：自动识别文章主题
- **关键词提取**：提取文章关键信息
- **情感分析**：分析文章情感倾向
- **摘要生成**：自动生成文章摘要

#### 2. 个性化推荐
- **相似内容**：推荐相似主题的文章
- **阅读建议**：基于历史推荐相关内容
- **兴趣分析**：分析用户兴趣偏好
- **学习路径**：推荐学习路径

#### 3. 知识关联
- **内容关联**：建立内容间的关联关系
- **知识图谱**：构建个人知识图谱
- **概念提取**：提取文章核心概念
- **关系分析**：分析概念间的关系

### 🔄 数据同步

#### 1. 实时同步
- **云端存储**：内容自动同步到云端
- **多设备同步**：与其他设备实时同步
- **离线缓存**：支持离线阅读和标注
- **冲突解决**：智能处理多设备冲突

#### 2. 数据导出
- **格式支持**：支持多种导出格式
- **批量导出**：批量导出收集的内容
- **自定义模板**：支持自定义导出模板
- **API集成**：支持第三方API集成

## 技术架构

### 插件结构

```
Browser/
├── manifest.json              # 插件配置文件
├── src/
│   ├── content-script.js      # 内容脚本
│   ├── background.js          # 后台脚本
│   ├── popup.js              # 弹出窗口
│   ├── options.js             # 设置页面
│   └── utils/
│       ├── content-parser.js  # 内容解析器
│       ├── annotation.js      # 标注功能
│       ├── sync-manager.js    # 同步管理
│       └── ai-processor.js    # AI处理器
├── assets/
│   ├── icons/                # 图标资源
│   ├── styles/               # 样式文件
│   └── templates/            # 模板文件
└── dist/                     # 构建输出
```

### 核心模块

#### 1. 内容脚本 (Content Script)
```javascript
// src/content-script.js
class ContentScript {
  constructor() {
    this.init();
  }

  init() {
    // 初始化内容脚本
    this.setupEventListeners();
    this.injectAnnotationTools();
    this.startContentAnalysis();
  }

  setupEventListeners() {
    // 设置事件监听器
    document.addEventListener('selectionchange', this.handleTextSelection.bind(this));
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  injectAnnotationTools() {
    // 注入标注工具
    const annotationToolbar = this.createAnnotationToolbar();
    document.body.appendChild(annotationToolbar);
  }

  startContentAnalysis() {
    // 开始内容分析
    this.analyzePageContent();
    this.extractMetadata();
    this.generateSummary();
  }
}
```

#### 2. 后台脚本 (Background Script)
```javascript
// src/background.js
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // 初始化后台服务
    this.setupMessageHandlers();
    this.initSyncService();
    this.setupAIService();
  }

  setupMessageHandlers() {
    // 设置消息处理器
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case 'SAVE_CONTENT':
          this.saveContent(request.data);
          break;
        case 'ANALYZE_CONTENT':
          this.analyzeContent(request.data);
          break;
        case 'SYNC_DATA':
          this.syncData();
          break;
      }
    });
  }

  async saveContent(contentData) {
    // 保存内容到本地和云端
    const processedData = await this.processContent(contentData);
    await this.saveToLocal(processedData);
    await this.syncToCloud(processedData);
  }

  async analyzeContent(content) {
    // 使用AI分析内容
    const analysis = await this.aiService.analyze(content);
    return analysis;
  }
}
```

#### 3. 弹出窗口 (Popup)
```javascript
// src/popup.js
class PopupInterface {
  constructor() {
    this.init();
  }

  init() {
    // 初始化弹出窗口
    this.setupUI();
    this.loadCurrentPageData();
    this.setupEventHandlers();
  }

  setupUI() {
    // 设置用户界面
    this.createQuickActions();
    this.createContentPreview();
    this.createAnnotationList();
  }

  async loadCurrentPageData() {
    // 加载当前页面数据
    const tab = await this.getCurrentTab();
    const pageData = await this.getPageData(tab.url);
    this.updateUI(pageData);
  }

  createQuickActions() {
    // 创建快速操作按钮
    const actions = [
      { id: 'save', label: '保存页面', icon: 'save' },
      { id: 'annotate', label: '添加标注', icon: 'edit' },
      { id: 'analyze', label: 'AI分析', icon: 'ai' },
      { id: 'sync', label: '同步数据', icon: 'sync' }
    ];

    actions.forEach(action => {
      const button = this.createActionButton(action);
      this.container.appendChild(button);
    });
  }
}
```

### AI集成

#### 1. 本地AI处理
```javascript
// src/utils/ai-processor.js
class AIProcessor {
  constructor() {
    this.init();
  }

  async init() {
    // 初始化AI处理器
    this.setupByenatOS();
    this.setupExternalAI();
  }

  async setupByenatOS() {
    // 设置byenatOS集成
    this.byenatOS = new ByenatOS({
      apiKey: process.env.BYENATOS_API_KEY,
      localMode: true
    });
  }

  async analyzeContent(content) {
    // 分析内容
    const analysis = {
      topics: await this.extractTopics(content),
      keywords: await this.extractKeywords(content),
      sentiment: await this.analyzeSentiment(content),
      summary: await this.generateSummary(content)
    };

    return analysis;
  }

  async extractTopics(content) {
    // 提取主题
    return await this.byenatOS.extractTopics({
      content: content.text,
      maxTopics: 5
    });
  }

  async generateSummary(content) {
    // 生成摘要
    return await this.byenatOS.generateSummary({
      content: content.text,
      maxLength: 200
    });
  }
}
```

#### 2. 外部AI调用
```javascript
// src/utils/external-ai.js
class ExternalAIService {
  constructor() {
    this.setupAPIs();
  }

  setupAPIs() {
    // 设置外部AI API
    this.openAI = new OpenAI(process.env.OPENAI_API_KEY);
    this.claude = new Claude(process.env.CLAUDE_API_KEY);
  }

  async processWithExternalAI(content, model = 'auto') {
    // 使用外部AI处理内容
    const aiModel = this.selectModel(model, content);
    const result = await aiModel.process(content);
    return result;
  }

  selectModel(model, content) {
    // 智能选择AI模型
    switch (model) {
      case 'openai':
        return this.openAI;
      case 'claude':
        return this.claude;
      case 'auto':
        return this.selectBestModel(content);
      default:
        return this.openAI;
    }
  }
}
```

### 数据管理

#### 1. 本地存储
```javascript
// src/utils/storage-manager.js
class StorageManager {
  constructor() {
    this.init();
  }

  async init() {
    // 初始化存储管理器
    this.setupIndexedDB();
    this.setupChromeStorage();
  }

  async saveContent(content) {
    // 保存内容到本地存储
    const contentData = {
      id: this.generateId(),
      url: content.url,
      title: content.title,
      content: content.text,
      metadata: content.metadata,
      annotations: content.annotations,
      analysis: content.analysis,
      timestamp: Date.now()
    };

    await this.saveToIndexedDB('contents', contentData);
    await this.saveToChromeStorage('recent_contents', contentData);
  }

  async getContent(url) {
    // 获取内容
    return await this.getFromIndexedDB('contents', { url });
  }

  async getAllContents() {
    // 获取所有内容
    return await this.getAllFromIndexedDB('contents');
  }
}
```

#### 2. 同步服务
```javascript
// src/utils/sync-manager.js
class SyncManager {
  constructor() {
    this.init();
  }

  async init() {
    // 初始化同步管理器
    this.setupWebSocket();
    this.setupPeriodicSync();
  }

  async syncToCloud(data) {
    // 同步到云端
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('数据同步成功');
        return true;
      }
    } catch (error) {
      console.error('同步失败:', error);
      return false;
    }
  }

  async syncFromCloud() {
    // 从云端同步
    try {
      const response = await fetch('/api/sync', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        await this.updateLocalData(data);
        return true;
      }
    } catch (error) {
      console.error('同步失败:', error);
      return false;
    }
  }
}
```

## 用户界面

### 主要界面

#### 1. 弹出窗口 (Popup)
- 快速保存按钮
- 当前页面信息
- 最近保存的内容
- 快速标注工具

#### 2. 标注工具栏
- 文本选择高亮
- 笔记添加工具
- 标签管理
- 重点标记

#### 3. 设置页面
- 账户管理
- 同步设置
- AI模型配置
- 快捷键设置

### 交互设计

#### 1. 快捷键支持
- `Ctrl+Shift+S`: 快速保存页面
- `Ctrl+Shift+A`: 添加标注
- `Ctrl+Shift+N`: 添加笔记
- `Ctrl+Shift+T`: 添加标签

#### 2. 右键菜单
- 保存选中文本
- 添加标注
- 翻译文本
- 搜索相关内容

#### 3. 拖拽功能
- 拖拽保存图片
- 拖拽保存链接
- 拖拽添加标签

## 开发计划

### 第一阶段：基础功能
- [ ] 插件基础架构
- [ ] 内容抓取功能
- [ ] 本地存储
- [ ] 基础UI界面

### 第二阶段：核心功能
- [ ] 标注功能
- [ ] AI分析集成
- [ ] 数据同步
- [ ] 用户设置

### 第三阶段：高级功能
- [ ] 高级AI分析
- [ ] 知识图谱
- [ ] 个性化推荐
- [ ] 数据导出

### 第四阶段：优化完善
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 多浏览器支持
- [ ] 发布准备

## 技术挑战

### 1. 跨浏览器兼容性
- Chrome、Firefox、Safari API差异
- 不同浏览器的安全策略
- 插件权限管理

### 2. 内容解析准确性
- 复杂网页结构解析
- 动态内容处理
- 反爬虫机制应对

### 3. 性能优化
- 大页面内容处理
- 内存使用优化
- 响应速度优化

### 4. 隐私保护
- 用户数据安全
- 本地处理优先
- 透明数据处理

## 测试策略

### 单元测试
- 核心功能测试
- API集成测试
- 数据处理测试

### 集成测试
- 跨浏览器测试
- 端到端功能测试
- 性能压力测试

### 用户测试
- 用户体验测试
- 兼容性测试
- 安全性测试

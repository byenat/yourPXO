# Browser 浏览器插件

## 概述

Browser模块是yourPXO的浏览器扩展，支持Chrome、Firefox、Safari等主流浏览器，为用户提供网页浏览时的个人体验优化功能。

## 功能特性

### 🌐 浏览器集成
- **网页内容分析** - 智能分析网页内容并提供优化建议
- **表单自动填充** - 基于用户习惯的智能表单填充
- **智能搜索** - 个性化搜索建议和结果优化
- **阅读模式** - 专注阅读模式，去除干扰元素

### 🤖 AI集成
- **byenatOS集成** - 通过byenatOS SDK获得AI能力
- **内容理解** - 智能理解网页内容
- **个性化推荐** - 基于用户行为的个性化推荐
- **智能摘要** - 自动生成网页内容摘要

### 🔄 数据同步
- **跨设备同步** - 与其他设备的数据实时同步
- **书签同步** - 智能书签管理和同步
- **历史记录** - 智能历史记录分析
- **标签页管理** - 智能标签页分组和管理

## 技术栈

### 前端框架
- **React** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Redux Toolkit** - 状态管理
- **React Router** - 路由管理

### 浏览器API
- **Chrome Extension API** - Chrome扩展API
- **WebExtension API** - 跨浏览器扩展API
- **Content Scripts** - 内容脚本
- **Background Scripts** - 后台脚本

### UI组件
- **Ant Design** - UI组件库
- **Styled Components** - 样式管理
- **React Hook Form** - 表单管理
- **React Query** - 数据获取

## 项目结构

```
Browser/
├── src/
│   ├── popup/             # 弹出窗口
│   ├── content/           # 内容脚本
│   ├── background/        # 后台脚本
│   ├── options/           # 选项页面
│   ├── shared/            # 共享代码
│   ├── assets/            # 静态资源
│   └── types/             # TypeScript类型定义
├── public/                # 公共资源
├── dist/                  # 构建输出
├── __tests__/             # 测试文件
├── docs/                  # 文档
└── package.json
```

## 核心功能

### 1. 弹出窗口 (Popup)
```typescript
// src/popup/Popup.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../shared/store';
import PopupContent from './PopupContent';

const Popup: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="popup-container">
        <PopupContent />
      </div>
    </Provider>
  );
};

export default Popup;
```

### 2. 内容脚本 (Content Script)
```typescript
// src/content/contentScript.ts
import { ByenatOSService } from '../shared/services/byenatOSService';

class ContentScript {
  private byenatOS: ByenatOSService;
  
  constructor() {
    this.byenatOS = new ByenatOSService();
    this.initialize();
  }
  
  private async initialize() {
    // 分析页面内容
    await this.analyzePageContent();
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 注入优化功能
    this.injectOptimizations();
  }
  
  private async analyzePageContent() {
    const pageContent = this.extractPageContent();
    const analysis = await this.byenatOS.analyzeContent({
      content: pageContent,
      url: window.location.href,
      userId: await this.getUserId()
    });
    
    this.applyOptimizations(analysis);
  }
  
  private extractPageContent() {
    // 提取页面主要内容
    const article = document.querySelector('article') || document.body;
    return article.textContent || '';
  }
  
  private applyOptimizations(analysis: any) {
    // 应用优化建议
    if (analysis.readingMode) {
      this.enableReadingMode();
    }
    
    if (analysis.focusMode) {
      this.enableFocusMode();
    }
  }
  
  private enableReadingMode() {
    // 启用阅读模式
    document.body.classList.add('yourPXO-reading-mode');
  }
  
  private enableFocusMode() {
    // 启用专注模式
    document.body.classList.add('yourPXO-focus-mode');
  }
}

new ContentScript();
```

### 3. 后台脚本 (Background Script)
```typescript
// src/background/backgroundScript.ts
import { ByenatOSService } from '../shared/services/byenatOSService';

class BackgroundScript {
  private byenatOS: ByenatOSService;
  
  constructor() {
    this.byenatOS = new ByenatOSService();
    this.initialize();
  }
  
  private initialize() {
    // 监听标签页更新
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate);
    
    // 监听扩展安装
    chrome.runtime.onInstalled.addListener(this.handleInstall);
    
    // 设置消息监听
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }
  
  private async handleTabUpdate(tabId: number, changeInfo: any, tab: any) {
    if (changeInfo.status === 'complete') {
      await this.analyzeTab(tab);
    }
  }
  
  private async analyzeTab(tab: any) {
    const analysis = await this.byenatOS.analyzeTab({
      url: tab.url,
      title: tab.title,
      userId: await this.getUserId()
    });
    
    // 更新标签页图标
    this.updateTabIcon(tab.id, analysis);
  }
  
  private async handleMessage(request: any, sender: any, sendResponse: any) {
    switch (request.type) {
      case 'GET_PERSONALIZED_PROMPT':
        const prompt = await this.byenatOS.getPersonalizedPrompt(request.userId);
        sendResponse({ prompt });
        break;
        
      case 'UPDATE_USER_ACTIVITY':
        await this.byenatOS.updateActivity({
          userId: request.userId,
          activity: request.activity,
          source: 'browser'
        });
        sendResponse({ success: true });
        break;
    }
  }
}

new BackgroundScript();
```

## 浏览器集成

### 1. 清单文件 (Manifest)
```json
// public/manifest.json
{
  "manifest_version": 3,
  "name": "yourPXO",
  "version": "1.0.0",
  "description": "个人体验优化浏览器扩展",
  
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "bookmarks",
    "history"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "yourPXO"
  },
  
  "options_page": "options.html"
}
```

### 2. 选项页面
```typescript
// src/options/Options.tsx
import React from 'react';
import { Form, Input, Switch, Button, Card } from 'antd';

const Options: React.FC = () => {
  const [form] = Form.useForm();
  
  const handleSave = async (values: any) => {
    await chrome.storage.sync.set(values);
    // 保存设置
  };
  
  return (
    <div className="options-container">
      <Card title="yourPXO 设置">
        <Form form={form} onFinish={handleSave}>
          <Form.Item label="启用AI助手" name="enableAI">
            <Switch />
          </Form.Item>
          
          <Form.Item label="启用阅读模式" name="enableReadingMode">
            <Switch />
          </Form.Item>
          
          <Form.Item label="启用专注模式" name="enableFocusMode">
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Options;
```

## 智能功能

### 1. 智能表单填充
```typescript
// src/content/formFiller.ts
class FormFiller {
  async fillForm() {
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      for (const input of inputs) {
        await this.fillInput(input as HTMLInputElement);
      }
    }
  }
  
  private async fillInput(input: HTMLInputElement) {
    const fieldType = this.detectFieldType(input);
    const value = await this.getPersonalizedValue(fieldType);
    
    if (value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  private detectFieldType(input: HTMLInputElement): string {
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();
    
    if (name.includes('email') || id.includes('email')) return 'email';
    if (name.includes('name') || id.includes('name')) return 'name';
    if (name.includes('phone') || id.includes('phone')) return 'phone';
    
    return 'unknown';
  }
  
  private async getPersonalizedValue(fieldType: string): Promise<string> {
    // 从用户配置中获取个性化值
    const result = await chrome.storage.sync.get(['userProfile']);
    return result.userProfile?.[fieldType] || '';
  }
}
```

### 2. 智能搜索
```typescript
// src/content/searchOptimizer.ts
class SearchOptimizer {
  async optimizeSearch() {
    const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"]');
    
    for (const input of searchInputs) {
      this.addSearchSuggestions(input as HTMLInputElement);
    }
  }
  
  private addSearchSuggestions(input: HTMLInputElement) {
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'yourPXO-search-suggestions';
    
    input.addEventListener('input', async (e) => {
      const query = (e.target as HTMLInputElement).value;
      const suggestions = await this.getSearchSuggestions(query);
      this.showSuggestions(suggestionsContainer, suggestions);
    });
    
    input.parentNode?.appendChild(suggestionsContainer);
  }
  
  private async getSearchSuggestions(query: string): Promise<string[]> {
    // 基于用户历史获取搜索建议
    const history = await chrome.history.search({
      text: query,
      maxResults: 10
    });
    
    return history.map(item => item.title);
  }
  
  private showSuggestions(container: HTMLElement, suggestions: string[]) {
    container.innerHTML = suggestions
      .map(suggestion => `<div class="suggestion">${suggestion}</div>`)
      .join('');
  }
}
```

## 数据管理

### 1. 本地存储
```typescript
// src/shared/storage.ts
class StorageManager {
  async saveData(key: string, data: any) {
    await chrome.storage.sync.set({ [key]: data });
  }
  
  async getData(key: string) {
    const result = await chrome.storage.sync.get([key]);
    return result[key];
  }
  
  async removeData(key: string) {
    await chrome.storage.sync.remove([key]);
  }
  
  async clearAll() {
    await chrome.storage.sync.clear();
  }
}

export default new StorageManager();
```

### 2. 数据同步
```typescript
// src/shared/sync.ts
class SyncManager {
  async syncBookmarks() {
    const bookmarks = await chrome.bookmarks.getTree();
    await this.uploadToCloud('bookmarks', bookmarks);
  }
  
  async syncHistory() {
    const history = await chrome.history.search({
      text: '',
      maxResults: 1000
    });
    await this.uploadToCloud('history', history);
  }
  
  private async uploadToCloud(type: string, data: any) {
    // 上传到云端
  }
}

export default new SyncManager();
```

## 构建与部署

### 1. 开发环境
```bash
# 安装依赖
npm install

# 开发模式
npm run dev
```

### 2. 生产构建
```bash
# 构建扩展
npm run build

# 打包扩展
npm run dist
```

### 3. 浏览器特定构建
```bash
# Chrome
npm run build:chrome

# Firefox
npm run build:firefox

# Safari
npm run build:safari
```

## 性能优化

### 1. 内容脚本优化
- 延迟加载非关键功能
- 使用MutationObserver监听DOM变化
- 优化选择器性能

### 2. 后台脚本优化
- 使用Service Worker缓存
- 批量处理API请求
- 优化存储操作

### 3. 内存管理
- 及时清理事件监听器
- 避免内存泄漏
- 优化大对象处理

## 安全考虑

### 1. 权限管理
- 最小权限原则
- 用户确认敏感操作
- 安全的API调用

### 2. 数据保护
- 本地数据加密
- 安全的传输协议
- 用户隐私保护

### 3. 内容安全
- CSP策略
- XSS防护
- 安全的DOM操作

## 测试

### 1. 单元测试
```typescript
// __tests__/content/formFiller.test.ts
import FormFiller from '../../src/content/formFiller';

describe('FormFiller', () => {
  it('should detect field type correctly', () => {
    const input = document.createElement('input');
    input.name = 'user_email';
    
    const fieldType = FormFiller.detectFieldType(input);
    expect(fieldType).toBe('email');
  });
});
```

### 2. 集成测试
- 跨浏览器兼容性测试
- 扩展API测试
- 用户交互测试

## 监控与分析

### 1. 错误追踪
- 扩展崩溃报告
- 性能监控
- 用户行为分析

### 2. 使用统计
- 功能使用统计
- 用户留存分析
- A/B测试支持

# Desktop 桌面端应用

## 概述

Desktop模块是yourPXO的桌面端应用，支持Windows、macOS和Linux平台，为用户提供强大的桌面端个人体验优化功能。

## 功能特性

### 💻 桌面端特性
- **系统集成** - 与操作系统深度集成
- **快捷键支持** - 全局快捷键和自定义快捷键
- **后台运行** - 系统托盘和后台服务
- **通知系统** - 系统级通知和提醒

### 🤖 AI集成
- **byenatOS集成** - 通过byenatOS SDK获得AI能力
- **本地AI处理** - 支持本地AI模型，保护隐私
- **智能工作流** - 自动化工作流程
- **场景识别** - 自动识别工作场景

### 🔄 数据同步
- **跨设备同步** - 与其他设备的数据实时同步
- **云端备份** - 自动云端数据备份
- **版本控制** - 配置文件版本管理
- **冲突解决** - 智能数据冲突检测和解决

## 技术栈

### 前端框架
- **Electron** - 跨平台桌面应用框架
- **React** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Redux Toolkit** - 状态管理

### 系统集成
- **Node.js** - 后端运行时
- **SQLite** - 本地数据库
- **WebSocket** - 实时通信
- **IPC** - 进程间通信

### UI组件
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **Styled Components** - 样式管理
- **React Hook Form** - 表单管理

## 项目结构

```
Desktop/
├── src/
│   ├── main/              # 主进程代码
│   ├── renderer/          # 渲染进程代码
│   ├── shared/            # 共享代码
│   ├── assets/            # 静态资源
│   └── types/             # TypeScript类型定义
├── electron/              # Electron配置
├── build/                 # 构建配置
├── dist/                  # 构建输出
├── __tests__/             # 测试文件
├── docs/                  # 文档
└── package.json
```

## 核心功能

### 1. 主进程 (Main Process)
```typescript
// src/main/index.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

class DesktopApp {
  private mainWindow: BrowserWindow | null = null;
  
  constructor() {
    this.initializeApp();
    this.setupIPC();
  }
  
  private initializeApp() {
    app.whenReady().then(() => {
      this.createMainWindow();
    });
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }
  
  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    
    this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  
  private setupIPC() {
    // 设置IPC通信
    ipcMain.handle('get-user-config', this.getUserConfig);
    ipcMain.handle('update-user-config', this.updateUserConfig);
  }
}

new DesktopApp();
```

### 2. 渲染进程 (Renderer Process)
```typescript
// src/renderer/App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router } from 'react-router-dom';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
};

export default App;
```

### 3. byenatOS集成
```typescript
// src/shared/services/byenatOSService.ts
import { ByenatOS } from '@byenatos/sdk';

class ByenatOSService {
  private byenatOS: ByenatOS;
  
  constructor() {
    this.byenatOS = new ByenatOS({
      apiKey: process.env.BYENATOS_API_KEY,
      localMode: true,
      platform: 'desktop'
    });
  }
  
  async getPersonalizedPrompt(userId: string, context?: string) {
    return await this.byenatOS.getPersonalizedPrompt({
      userId,
      context,
      platform: 'desktop'
    });
  }
  
  async analyzeWorkflow(userId: string, workflowData: any) {
    return await this.byenatOS.analyzeWorkflow({
      userId,
      workflow: workflowData,
      source: 'desktop'
    });
  }
}

export default new ByenatOSService();
```

## 系统集成

### 1. 系统托盘
```typescript
// src/main/tray.ts
import { Tray, Menu, app } from 'electron';
import { join } from 'path';

export class SystemTray {
  private tray: Tray | null = null;
  
  constructor() {
    this.createTray();
  }
  
  private createTray() {
    const iconPath = join(__dirname, '../assets/tray-icon.png');
    this.tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      { label: '打开应用', click: () => this.showMainWindow() },
      { label: '专注模式', click: () => this.toggleFocusMode() },
      { type: 'separator' },
      { label: '设置', click: () => this.openSettings() },
      { label: '退出', click: () => app.quit() }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('yourPXO');
  }
  
  private showMainWindow() {
    // 显示主窗口
  }
  
  private toggleFocusMode() {
    // 切换专注模式
  }
  
  private openSettings() {
    // 打开设置
  }
}
```

### 2. 全局快捷键
```typescript
// src/main/shortcuts.ts
import { globalShortcut, app } from 'electron';

export class GlobalShortcuts {
  constructor() {
    this.registerShortcuts();
  }
  
  private registerShortcuts() {
    // 注册全局快捷键
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      this.toggleFocusMode();
    });
    
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      this.openAI();
    });
  }
  
  private toggleFocusMode() {
    // 切换专注模式
  }
  
  private openAI() {
    // 打开AI助手
  }
}
```

## 数据管理

### 1. 本地数据库
```typescript
// src/shared/database/index.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

class Database {
  private db: any;
  
  async initialize() {
    this.db = await open({
      filename: 'yourPXO.db',
      driver: sqlite3.Database
    });
    
    await this.createTables();
  }
  
  private async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME,
        end_time DATETIME,
        duration INTEGER,
        focus_score REAL
      );
    `);
  }
  
  async getUserConfig(key: string) {
    const row = await this.db.get(
      'SELECT value FROM user_config WHERE key = ?',
      [key]
    );
    return row ? JSON.parse(row.value) : null;
  }
  
  async setUserConfig(key: string, value: any) {
    await this.db.run(
      'INSERT OR REPLACE INTO user_config (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  }
}

export default new Database();
```

### 2. 配置同步
```typescript
// src/shared/services/syncService.ts
import { ipcRenderer } from 'electron';

class SyncService {
  async syncUserConfig() {
    try {
      const config = await ipcRenderer.invoke('get-user-config');
      await this.uploadToCloud(config);
    } catch (error) {
      console.error('同步失败:', error);
    }
  }
  
  async uploadToCloud(config: any) {
    // 上传到云端
  }
  
  async downloadFromCloud() {
    // 从云端下载
  }
}

export default new SyncService();
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
# 构建应用
npm run build

# 打包应用
npm run dist
```

### 3. 平台特定构建
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 性能优化

### 1. 内存管理
- 及时释放不需要的资源
- 使用弱引用避免内存泄漏
- 优化图片和媒体资源

### 2. 启动优化
- 延迟加载非关键模块
- 预加载常用数据
- 优化主进程启动时间

### 3. 渲染优化
- 使用虚拟滚动
- 组件懒加载
- 减少不必要的重渲染

## 安全考虑

### 1. 内容安全策略
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### 2. 权限管理
- 最小权限原则
- 用户确认敏感操作
- 安全的文件访问

### 3. 数据保护
- 本地数据加密
- 安全的API通信
- 用户隐私保护

## 测试

### 1. 单元测试
```typescript
// __tests__/services/byenatOSService.test.ts
import ByenatOSService from '../../src/shared/services/byenatOSService';

describe('ByenatOSService', () => {
  it('should get personalized prompt', async () => {
    const prompt = await ByenatOSService.getPersonalizedPrompt('user_123');
    expect(prompt).toBeDefined();
  });
});
```

### 2. 集成测试
- 主进程与渲染进程通信测试
- 系统集成测试
- 跨平台兼容性测试

## 监控与分析

### 1. 错误追踪
- Sentry集成
- 崩溃报告
- 性能监控

### 2. 用户分析
- 功能使用统计
- 用户行为分析
- A/B测试支持

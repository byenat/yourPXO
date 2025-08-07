# yourPXO

个人体验优化系统 (Personal Experience Optimization)

## 项目简介

yourPXO是一个跨平台的个人体验优化应用，支持手机、电脑、浏览器插件和智能眼镜等多种设备。通过集成[byenatOS](https://github.com/byenat/byenatOS) AI操作系统，为用户提供个性化的AI增强体验。

## 核心特性

### 🚀 跨平台支持
- **移动端应用** - iOS/Android原生应用
- **桌面应用** - Windows/macOS/Linux桌面客户端
- **浏览器插件** - Chrome/Firefox/Safari扩展
- **智能眼镜** - AR/VR设备应用

### 🤖 AI能力集成
- 集成[byenatOS](https://github.com/byenat/byenatOS) AI操作系统
- 个人系统提示词管理 (PSP - Personal System Prompt)
- 场景化体验优化
- 专注工作场景支持
- 用户信任建立机制

### 🔄 数据同步
- 跨设备数据同步
- 统一用户配置文件
- 实时状态同步

## 技术架构

```
yourPXO
├── Mobile/          # 移动端应用
├── Desktop/         # 桌面应用
├── Browser/         # 浏览器插件
├── Glasses/         # 智能眼镜应用
├── Core/            # 核心共享逻辑
├── AI/              # AI集成层
│   └── byenatOS/    # byenatOS集成
├── Sync/            # 数据同步服务
└── Shared/          # 共享组件
```

## 与byenatOS的集成

yourPXO通过以下方式集成byenatOS：

1. **API集成** - 使用byenatOS SDK
2. **本地AI处理** - 利用byenatOS的本地AI能力
3. **跨应用记忆** - 统一的个人记忆系统
4. **隐私保护** - 本地数据处理

## 开发状态

项目正在初始开发阶段。

## 技术栈

- **前端框架**: React Native / Electron / Web Extension
- **后端服务**: Node.js / Python
- **AI集成**: byenatOS SDK
- **数据同步**: WebSocket / REST API
- **数据库**: SQLite / PostgreSQL

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证

MIT License

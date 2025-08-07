# Mobile 移动端应用

## 概述

Mobile模块是yourPXO的移动端应用，支持iOS和Android平台，为用户提供跨设备的个人体验优化功能。

## 功能特性

### 📱 核心功能
- **个人配置管理** - 用户偏好设置和个性化配置
- **场景化优化** - 根据当前场景提供智能优化建议
- **专注模式** - 专注工作场景的交互优化
- **跨设备同步** - 与其他设备的数据实时同步

### 🤖 AI集成
- **byenatOS集成** - 通过byenatOS SDK获得AI能力
- **个性化助手** - 基于用户行为的智能助手
- **本地AI处理** - 支持本地AI模型，保护隐私
- **智能推荐** - 基于用户习惯的智能推荐

### 🔄 数据同步
- **实时同步** - 与其他设备的实时数据同步
- **离线支持** - 本地缓存，支持离线使用
- **冲突解决** - 智能数据冲突检测和解决
- **安全传输** - 端到端加密的数据传输

## 技术栈

### 前端框架
- **React Native** - 跨平台开发框架
- **TypeScript** - 类型安全的JavaScript
- **Redux Toolkit** - 状态管理
- **React Navigation** - 导航管理

### UI组件
- **React Native Elements** - UI组件库
- **React Native Vector Icons** - 图标库
- **React Native Reanimated** - 动画库
- **React Native Gesture Handler** - 手势处理

### 后端集成
- **Axios** - HTTP客户端
- **WebSocket** - 实时通信
- **AsyncStorage** - 本地存储
- **React Native Keychain** - 安全存储

## 项目结构

```
Mobile/
├── src/
│   ├── components/        # 可复用组件
│   ├── screens/          # 页面组件
│   ├── navigation/       # 导航配置
│   ├── store/           # Redux状态管理
│   ├── services/        # API服务
│   ├── utils/           # 工具函数
│   ├── hooks/           # 自定义Hooks
│   ├── types/           # TypeScript类型定义
│   └── assets/          # 静态资源
├── android/             # Android原生代码
├── ios/                 # iOS原生代码
├── __tests__/           # 测试文件
├── docs/                # 文档
└── package.json
```

## 核心组件

### 1. 主应用组件
```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
```

### 2. byenatOS集成服务
```typescript
// src/services/byenatOSService.ts
import { ByenatOS } from '@byenatos/sdk';

class ByenatOSService {
  private byenatOS: ByenatOS;
  
  constructor() {
    this.byenatOS = new ByenatOS({
      apiKey: process.env.BYENATOS_API_KEY,
      localMode: true
    });
  }
  
  async getPersonalizedPrompt(userId: string) {
    return await this.byenatOS.getPersonalizedPrompt({
      userId,
      platform: 'mobile'
    });
  }
  
  async updateUserActivity(userId: string, activity: any) {
    return await this.byenatOS.updateActivity({
      userId,
      activity,
      source: 'mobile'
    });
  }
}

export default new ByenatOSService();
```

### 3. 专注模式组件
```typescript
// src/components/FocusMode.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusMode } from '../hooks/useFocusMode';

const FocusMode = () => {
  const { isFocused, focusScore, toggleFocus, recommendations } = useFocusMode();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>专注模式</Text>
      <TouchableOpacity 
        style={[styles.button, isFocused && styles.activeButton]}
        onPress={toggleFocus}
      >
        <Text style={styles.buttonText}>
          {isFocused ? '退出专注' : '进入专注'}
        </Text>
      </TouchableOpacity>
      {isFocused && (
        <View style={styles.focusInfo}>
          <Text>专注度: {focusScore}%</Text>
          <Text>建议: {recommendations}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  focusInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
});

export default FocusMode;
```

## 页面结构

### 主要页面
1. **首页** - 概览和快速操作
2. **个人配置** - 用户设置和偏好
3. **场景管理** - 场景化配置
4. **专注模式** - 专注工作场景
5. **AI助手** - 智能助手界面
6. **设备同步** - 设备管理

### 导航结构
```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScenariosScreen from '../screens/ScenariosScreen';
import FocusScreen from '../screens/FocusScreen';
import AIScreen from '../screens/AIScreen';
import SyncScreen from '../screens/SyncScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Scenarios" component={ScenariosScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
      <Tab.Screen name="Sync" component={SyncScreen} />
    </Tab.Navigator>
  );
};

export default RootNavigator;
```

## 状态管理

### Redux Store结构
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import configReducer from './slices/configSlice';
import focusReducer from './slices/focusSlice';
import syncReducer from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    config: configReducer,
    focus: focusReducer,
    sync: syncReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 用户状态管理
```typescript
// src/store/slices/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: string | null;
  email: string | null;
  preferences: any;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  id: null,
  email: null,
  preferences: {},
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; email: string }>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.isLoggedIn = true;
    },
    setPreferences: (state, action: PayloadAction<any>) => {
      state.preferences = action.payload;
    },
    logout: (state) => {
      state.id = null;
      state.email = null;
      state.preferences = {};
      state.isLoggedIn = false;
    },
  },
});

export const { setUser, setPreferences, logout } = userSlice.actions;
export default userSlice.reducer;
```

## API集成

### 核心服务
```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败
      await AsyncStorage.removeItem('authToken');
      // 跳转到登录页面
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 本地存储

### 安全存储
```typescript
// src/utils/secureStorage.ts
import * as Keychain from 'react-native-keychain';

export const secureStorage = {
  async save(key: string, value: string) {
    try {
      await Keychain.setInternetCredentials(key, key, value);
    } catch (error) {
      console.error('Error saving to keychain:', error);
    }
  },
  
  async get(key: string) {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials?.password;
    } catch (error) {
      console.error('Error getting from keychain:', error);
      return null;
    }
  },
  
  async remove(key: string) {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      console.error('Error removing from keychain:', error);
    }
  },
};
```

## 测试

### 单元测试
```typescript
// __tests__/components/FocusMode.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FocusMode from '../../src/components/FocusMode';

describe('FocusMode', () => {
  it('should toggle focus mode when button is pressed', () => {
    const { getByText } = render(<FocusMode />);
    
    const button = getByText('进入专注');
    fireEvent.press(button);
    
    expect(getByText('退出专注')).toBeTruthy();
  });
});
```

## 部署

### iOS部署
```bash
# 安装依赖
npm install

# iOS构建
cd ios && pod install
cd .. && npx react-native run-ios
```

### Android部署
```bash
# Android构建
npx react-native run-android
```

### 生产构建
```bash
# iOS生产构建
npx react-native run-ios --configuration Release

# Android生产构建
cd android && ./gradlew assembleRelease
```

## 性能优化

### 代码分割
- 使用React.lazy进行组件懒加载
- 按需加载第三方库
- 优化图片资源

### 内存管理
- 及时清理事件监听器
- 优化列表渲染
- 使用React.memo优化组件

### 网络优化
- 请求缓存策略
- 图片懒加载
- 离线数据同步

## 监控与分析

### 错误追踪
- Sentry集成
- 崩溃报告
- 性能监控

### 用户分析
- 用户行为追踪
- 功能使用统计
- A/B测试支持

# Shared 共享组件

## 概述

Shared模块是yourPXO的共享组件库，包含所有平台通用的组件、工具函数、类型定义和配置，确保跨平台的一致性和代码复用。

## 功能特性

### 🔧 通用组件
- **UI组件** - 跨平台可复用的UI组件
- **工具函数** - 通用工具函数和辅助方法
- **类型定义** - TypeScript类型定义和接口
- **配置管理** - 统一配置管理和环境变量

### 🔄 数据模型
- **用户模型** - 用户数据结构和验证
- **设备模型** - 设备信息和管理
- **配置模型** - 应用配置和设置
- **同步模型** - 数据同步相关模型

### 🛠️ 开发工具
- **构建工具** - 跨平台构建配置
- **测试工具** - 通用测试框架和工具
- **代码规范** - ESLint、Prettier等代码规范
- **文档生成** - 自动文档生成工具

## 项目结构

```
Shared/
├── src/
│   ├── components/        # 通用UI组件
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript类型定义
│   ├── constants/        # 常量定义
│   ├── config/           # 配置管理
│   ├── services/         # 通用服务
│   ├── hooks/            # 自定义Hooks
│   └── assets/           # 静态资源
├── dist/                 # 构建输出
├── tests/                # 测试文件
├── docs/                 # 文档
└── package.json
```

## 核心组件

### 1. 通用UI组件
```typescript
// src/components/Button/Button.tsx
import React from 'react';
import { ButtonProps } from './Button.types';
import './Button.styles.css';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  className,
  ...props
}) => {
  const baseClass = 'yourPXO-button';
  const variantClass = `yourPXO-button--${variant}`;
  const sizeClass = `yourPXO-button--${size}`;
  const loadingClass = loading ? 'yourPXO-button--loading' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="yourPXO-button__loader" />}
      <span className="yourPXO-button__content">{children}</span>
    </button>
  );
};

export default Button;
```

```typescript
// src/components/Button/Button.types.ts
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

```css
/* src/components/Button/Button.styles.css */
.yourPXO-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.yourPXO-button--primary {
  background-color: #007AFF;
  color: white;
}

.yourPXO-button--secondary {
  background-color: #F2F2F7;
  color: #000000;
}

.yourPXO-button--outline {
  background-color: transparent;
  border: 1px solid #007AFF;
  color: #007AFF;
}

.yourPXO-button--ghost {
  background-color: transparent;
  color: #007AFF;
}

.yourPXO-button--small {
  padding: 8px 16px;
  font-size: 14px;
}

.yourPXO-button--medium {
  padding: 12px 24px;
  font-size: 16px;
}

.yourPXO-button--large {
  padding: 16px 32px;
  font-size: 18px;
}

.yourPXO-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yourPXO-button--loading .yourPXO-button__content {
  opacity: 0;
}

.yourPXO-button__loader {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 2. 工具函数
```typescript
// src/utils/storage.ts
export class StorageManager {
  private prefix = 'yourPXO_';
  
  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
  
  get(key: string): any {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }
  
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
  
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

export const storage = new StorageManager();
```

```typescript
// src/utils/validation.ts
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static validate(value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    
    // 必填检查
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push('此字段为必填项');
    }
    
    if (value) {
      // 长度检查
      if (rules.minLength && value.toString().length < rules.minLength) {
        errors.push(`最少需要 ${rules.minLength} 个字符`);
      }
      
      if (rules.maxLength && value.toString().length > rules.maxLength) {
        errors.push(`最多允许 ${rules.maxLength} 个字符`);
      }
      
      // 正则表达式检查
      if (rules.pattern && !rules.pattern.test(value.toString())) {
        errors.push('格式不正确');
      }
      
      // 自定义验证
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (typeof customResult === 'string') {
          errors.push(customResult);
        } else if (!customResult) {
          errors.push('验证失败');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  
  static validatePassword(password: string): ValidationResult {
    const rules: ValidationRule = {
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    };
    
    return this.validate(password, rules);
  }
}
```

### 3. 类型定义
```typescript
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  devices: Device[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  focus: FocusSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  focusMode: boolean;
  reminders: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  personalizedAds: boolean;
  locationSharing: boolean;
}

export interface FocusSettings {
  autoEnable: boolean;
  duration: number;
  breakDuration: number;
  notifications: boolean;
  websites: string[];
}

export interface Device {
  id: string;
  type: 'mobile' | 'desktop' | 'browser' | 'glasses';
  platform: string;
  version: string;
  name: string;
  lastSeen: Date;
  isOnline: boolean;
  isTrusted: boolean;
}
```

```typescript
// src/types/config.ts
export interface AppConfig {
  api: ApiConfig;
  sync: SyncConfig;
  ai: AIConfig;
  security: SecurityConfig;
  features: FeatureFlags;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface SyncConfig {
  interval: number;
  batchSize: number;
  retryAttempts: number;
  conflictResolution: 'latest' | 'manual' | 'merge';
}

export interface AIConfig {
  enabled: boolean;
  provider: 'byenatOS' | 'openai' | 'local';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionKey?: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export interface FeatureFlags {
  focusMode: boolean;
  aiAssistant: boolean;
  crossDeviceSync: boolean;
  analytics: boolean;
  betaFeatures: boolean;
}
```

### 4. 配置管理
```typescript
// src/config/index.ts
import { AppConfig } from '../types/config';

class ConfigManager {
  private config: AppConfig;
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  private loadConfig(): AppConfig {
    const env = process.env.NODE_ENV || 'development';
    
    const baseConfig: AppConfig = {
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.API_TIMEOUT || '10000'),
        retries: parseInt(process.env.API_RETRIES || '3'),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'yourPXO/1.0.0'
        }
      },
      sync: {
        interval: parseInt(process.env.SYNC_INTERVAL || '30000'),
        batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100'),
        retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3'),
        conflictResolution: (process.env.SYNC_CONFLICT_RESOLUTION as any) || 'latest'
      },
      ai: {
        enabled: process.env.AI_ENABLED === 'true',
        provider: (process.env.AI_PROVIDER as any) || 'byenatOS',
        apiKey: process.env.AI_API_KEY,
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7')
      },
      security: {
        encryptionEnabled: process.env.ENCRYPTION_ENABLED === 'true',
        encryptionKey: process.env.ENCRYPTION_KEY,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5')
      },
      features: {
        focusMode: process.env.FEATURE_FOCUS_MODE !== 'false',
        aiAssistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
        crossDeviceSync: process.env.FEATURE_CROSS_DEVICE_SYNC !== 'false',
        analytics: process.env.FEATURE_ANALYTICS !== 'false',
        betaFeatures: process.env.FEATURE_BETA_FEATURES === 'true'
      }
    };
    
    // 根据环境加载特定配置
    if (env === 'production') {
      return this.loadProductionConfig(baseConfig);
    } else if (env === 'staging') {
      return this.loadStagingConfig(baseConfig);
    } else {
      return this.loadDevelopmentConfig(baseConfig);
    }
  }
  
  private loadProductionConfig(baseConfig: AppConfig): AppConfig {
    return {
      ...baseConfig,
      api: {
        ...baseConfig.api,
        baseUrl: process.env.PRODUCTION_API_BASE_URL || baseConfig.api.baseUrl
      },
      security: {
        ...baseConfig.security,
        encryptionEnabled: true
      }
    };
  }
  
  private loadStagingConfig(baseConfig: AppConfig): AppConfig {
    return {
      ...baseConfig,
      api: {
        ...baseConfig.api,
        baseUrl: process.env.STAGING_API_BASE_URL || baseConfig.api.baseUrl
      }
    };
  }
  
  private loadDevelopmentConfig(baseConfig: AppConfig): AppConfig {
    return {
      ...baseConfig,
      features: {
        ...baseConfig.features,
        betaFeatures: true
      }
    };
  }
  
  getConfig(): AppConfig {
    return this.config;
  }
  
  getApiConfig() {
    return this.config.api;
  }
  
  getSyncConfig() {
    return this.config.sync;
  }
  
  getAIConfig() {
    return this.config.ai;
  }
  
  getSecurityConfig() {
    return this.config.security;
  }
  
  getFeatureFlags() {
    return this.config.features;
  }
  
  isFeatureEnabled(feature: keyof typeof this.config.features): boolean {
    return this.config.features[feature];
  }
}

export const configManager = new ConfigManager();
export const config = configManager.getConfig();
```

### 5. 通用服务
```typescript
// src/services/ApiService.ts
import { ApiConfig } from '../types/config';

export class ApiService {
  private config: ApiConfig;
  
  constructor(config: ApiConfig) {
    this.config = config;
  }
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        ...this.config.headers,
        ...options.headers
      },
      timeout: this.config.timeout
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retries) {
          throw lastError;
        }
        
        // 等待后重试
        await this.delay(1000 * attempt);
      }
    }
    
    throw lastError!;
  }
  
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 便捷方法
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
```

### 6. 自定义Hooks
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue] as const;
}
```

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

```typescript
// src/hooks/useAsync.ts
import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  });
  
  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, dependencies);
  
  useEffect(() => {
    execute();
  }, [execute]);
  
  return { ...state, refetch: execute };
}
```

## 构建配置

### 1. Webpack配置
```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'yourPXO-shared.js',
    library: 'YourPXOShared',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};
```

### 2. TypeScript配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 测试

### 1. 单元测试
```typescript
// tests/utils/validation.test.ts
import { Validator } from '../../src/utils/validation';

describe('Validator', () => {
  describe('validate', () => {
    it('should validate required fields', () => {
      const result = Validator.validate('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('此字段为必填项');
    });
    
    it('should validate email format', () => {
      expect(Validator.validateEmail('test@example.com')).toBe(true);
      expect(Validator.validateEmail('invalid-email')).toBe(false);
    });
    
    it('should validate password strength', () => {
      const result = Validator.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### 2. 组件测试
```typescript
// tests/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Button from '../../src/components/Button/Button';

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when disabled prop is true', () => {
    const { getByText } = render(
      <Button disabled>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeDisabled();
  });
});
```

## 文档生成

### 1. JSDoc配置
```javascript
// jsdoc.config.js
module.exports = {
  source: {
    include: ['src'],
    includePattern: '.+\\.ts(x)?$',
    excludePattern: '(node_modules/|docs)'
  },
  plugins: ['jsdoc-http-plugin'],
  opts: {
    destination: './docs',
    template: 'node_modules/docdash'
  },
  templates: {
    cleverLinks: false,
    monospaceLinks: false
  }
};
```

### 2. Storybook配置
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5'
  }
};
```

## 发布

### 1. NPM发布
```json
// package.json
{
  "name": "@yourPXO/shared",
  "version": "1.0.0",
  "description": "Shared components and utilities for yourPXO",
  "main": "dist/yourPXO-shared.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "webpack --mode production",
    "test": "jest",
    "docs": "jsdoc -c jsdoc.config.js",
    "storybook": "start-storybook -p 6006",
    "build-storybook": "build-storybook"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. 版本管理
```bash
#!/bin/bash
# scripts/release.sh

echo "Releasing new version..."

# 运行测试
npm test

# 构建项目
npm run build

# 生成文档
npm run docs

# 发布到NPM
npm publish

echo "Release completed!"
```

## 使用示例

### 1. 在React项目中使用
```typescript
import { Button, storage, Validator } from '@yourPXO/shared';

function App() {
  const [userData, setUserData] = useState(storage.get('userData'));
  
  const handleSave = () => {
    const validation = Validator.validate(userData, { required: true });
    if (validation.isValid) {
      storage.set('userData', userData);
    }
  };
  
  return (
    <div>
      <Button variant="primary" onClick={handleSave}>
        保存
      </Button>
    </div>
  );
}
```

### 2. 在Vue项目中使用
```typescript
import { Button, storage, Validator } from '@yourPXO/shared';

export default {
  data() {
    return {
      userData: storage.get('userData')
    };
  },
  methods: {
    handleSave() {
      const validation = Validator.validate(this.userData, { required: true });
      if (validation.isValid) {
        storage.set('userData', this.userData);
      }
    }
  }
};
```

这个Shared模块为yourPXO的所有平台提供了统一的组件库和工具函数，确保了跨平台的一致性和代码复用。

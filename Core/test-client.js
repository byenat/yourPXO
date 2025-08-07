const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class TestClient {
  constructor() {
    this.token = null;
    this.userId = null;
  }

  async registerUser() {
    try {
      const response = await axios.post(`${BASE_URL}/api/user/register`, {
        email: 'test@yourPXO.com',
        password: 'testpassword123',
        name: 'Test User'
      });

      this.token = response.data.token;
      this.userId = response.data.user.id;

      console.log('✅ 用户注册成功:', response.data.user.email);
      return response.data;
    } catch (error) {
      console.error('❌ 用户注册失败:', error.response?.data || error.message);
    }
  }

  async loginUser() {
    try {
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        email: 'test@yourPXO.com',
        password: 'testpassword123'
      });

      this.token = response.data.token;
      this.userId = response.data.user.id;

      console.log('✅ 用户登录成功:', response.data.user.email);
      return response.data;
    } catch (error) {
      console.error('❌ 用户登录失败:', error.response?.data || error.message);
    }
  }

  async getPersonalizedPrompt() {
    try {
      const response = await axios.post(`${BASE_URL}/api/ai/personalized-prompt`, {
        userId: this.userId,
        context: '我正在开发一个跨平台应用，需要AI能力支持'
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log('✅ 获取个性化提示词成功:');
      console.log('提示词:', response.data.prompt);
      return response.data;
    } catch (error) {
      console.error('❌ 获取个性化提示词失败:', error.response?.data || error.message);
    }
  }

  async updateActivity() {
    try {
      const response = await axios.post(`${BASE_URL}/api/ai/update-activity`, {
        userId: this.userId,
        activity: {
          type: 'development',
          duration: 120,
          description: '开发yourPXO应用',
          metadata: {
            project: 'yourPXO',
            platform: 'cross-platform',
            features: ['AI集成', '跨设备同步']
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log('✅ 更新活动成功:', response.data.message);
      return response.data;
    } catch (error) {
      console.error('❌ 更新活动失败:', error.response?.data || error.message);
    }
  }

  async analyzeContent() {
    try {
      const response = await axios.post(`${BASE_URL}/api/ai/analyze-content`, {
        userId: this.userId,
        content: 'yourPXO是一个跨平台的个人体验优化应用，通过集成byenatOS获得AI能力，为用户提供个性化的体验优化。'
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log('✅ 内容分析成功:');
      console.log('分析结果:', response.data.analysis);
      return response.data;
    } catch (error) {
      console.error('❌ 内容分析失败:', error.response?.data || error.message);
    }
  }

  async analyzeFocus() {
    try {
      const response = await axios.post(`${BASE_URL}/api/ai/focus-analysis`, {
        userId: this.userId,
        activityData: {
          duration: 1800, // 30分钟
          breaks: 2,
          interruptions: 5,
          focusSessions: [
            { start: '2024-01-01T09:00:00Z', end: '2024-01-01T09:25:00Z' },
            { start: '2024-01-01T09:30:00Z', end: '2024-01-01T09:55:00Z' }
          ]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log('✅ 专注度分析成功:');
      console.log('专注度分数:', response.data.analysis.focusScore);
      console.log('是否专注:', response.data.analysis.isFocused);
      console.log('建议:', response.data.analysis.recommendations);
      return response.data;
    } catch (error) {
      console.error('❌ 专注度分析失败:', error.response?.data || error.message);
    }
  }

  async registerDevice() {
    try {
      const response = await axios.post(`${BASE_URL}/api/device/register`, {
        userId: this.userId,
        type: 'desktop',
        platform: 'macOS',
        version: '1.0.0',
        name: 'MacBook Pro'
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log('✅ 设备注册成功:', response.data.device.name);
      return response.data;
    } catch (error) {
      console.error('❌ 设备注册失败:', error.response?.data || error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 开始测试yourPXO与byenatOS的集成...\n');

    // 1. 用户注册
    await this.registerUser();
    if (!this.token) {
      console.log('❌ 无法继续测试，用户认证失败');
      return;
    }

    // 2. 获取个性化提示词
    console.log('\n📝 测试获取个性化提示词...');
    await this.getPersonalizedPrompt();

    // 3. 更新用户活动
    console.log('\n📊 测试更新用户活动...');
    await this.updateActivity();

    // 4. 内容分析
    console.log('\n🔍 测试内容分析...');
    await this.analyzeContent();

    // 5. 专注度分析
    console.log('\n🎯 测试专注度分析...');
    await this.analyzeFocus();

    // 6. 设备注册
    console.log('\n📱 测试设备注册...');
    await this.registerDevice();

    console.log('\n✅ 所有测试完成！');
  }
}

// 运行测试
const client = new TestClient();
client.runAllTests().catch(console.error);

import { Request, Response } from 'express';
import { Logger } from '../utils/Logger';

// byenatOS SDK模拟 - 实际使用时需要替换为真实的SDK
class ByenatOSSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.byenatos.org') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getPersonalizedPrompt(userId: string, context?: string): Promise<string> {
    // 模拟API调用
    const response = await fetch(`${this.baseUrl}/api/personalized-prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        context,
        platform: 'yourPXO'
      })
    });

    if (!response.ok) {
      throw new Error(`byenatOS API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt;
  }

  async updateActivity(userId: string, activity: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        activity,
        source: 'yourPXO'
      })
    });

    if (!response.ok) {
      throw new Error(`byenatOS API error: ${response.statusText}`);
    }
  }

  async analyzeContent(content: string, userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/analyze-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        userId,
        analysisType: 'general'
      })
    });

    if (!response.ok) {
      throw new Error(`byenatOS API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async analyzeFocus(userId: string, activityData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/analyze-focus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        activity: activityData,
        analysisType: 'focus'
      })
    });

    if (!response.ok) {
      throw new Error(`byenatOS API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export class ByenatOSService {
  private sdk: ByenatOSSDK;
  private logger: Logger;

  constructor() {
    const apiKey = process.env.BYENATOS_API_KEY || 'demo-key';
    const baseUrl = process.env.BYENATOS_BASE_URL || 'https://api.byenatos.org';
    
    this.sdk = new ByenatOSSDK(apiKey, baseUrl);
    this.logger = new Logger();
  }

  async getPersonalizedPrompt(req: Request, res: Response) {
    try {
      const { userId, context } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      this.logger.info('Getting personalized prompt', { userId, context });

      const prompt = await this.sdk.getPersonalizedPrompt(userId, context);

      res.json({
        success: true,
        prompt,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get personalized prompt', error);
      res.status(500).json({ 
        error: 'Failed to get personalized prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateActivity(req: Request, res: Response) {
    try {
      const { userId, activity } = req.body;

      if (!userId || !activity) {
        return res.status(400).json({ error: 'userId and activity are required' });
      }

      this.logger.info('Updating user activity', { userId, activityType: activity.type });

      await this.sdk.updateActivity(userId, activity);

      res.json({
        success: true,
        message: 'Activity updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to update activity', error);
      res.status(500).json({ 
        error: 'Failed to update activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async analyzeContent(req: Request, res: Response) {
    try {
      const { content, userId } = req.body;

      if (!content || !userId) {
        return res.status(400).json({ error: 'content and userId are required' });
      }

      this.logger.info('Analyzing content', { userId, contentLength: content.length });

      const analysis = await this.sdk.analyzeContent(content, userId);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to analyze content', error);
      res.status(500).json({ 
        error: 'Failed to analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async analyzeFocus(req: Request, res: Response) {
    try {
      const { userId, activityData } = req.body;

      if (!userId || !activityData) {
        return res.status(400).json({ error: 'userId and activityData are required' });
      }

      this.logger.info('Analyzing focus', { userId });

      const analysis = await this.sdk.analyzeFocus(userId, activityData);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to analyze focus', error);
      res.status(500).json({ 
        error: 'Failed to analyze focus',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 模拟byenatOS响应（用于开发测试）
  async getMockPersonalizedPrompt(userId: string, context?: string): Promise<string> {
    const basePrompt = `你是一个个性化的AI助手，专门为用户${userId}提供帮助。`;
    
    if (context) {
      return `${basePrompt} 当前上下文：${context}。请根据用户的习惯和偏好提供个性化的建议。`;
    }
    
    return `${basePrompt} 请根据用户的历史行为和偏好，提供个性化的建议和帮助。`;
  }

  async getMockFocusAnalysis(userId: string, activityData: any): Promise<any> {
    // 模拟专注度分析
    const focusScore = Math.random() * 100;
    const isFocused = focusScore > 70;
    
    return {
      focusScore: Math.round(focusScore),
      isFocused,
      recommendations: isFocused 
        ? ['继续保持专注状态', '建议适当休息'] 
        : ['建议开启专注模式', '减少干扰因素'],
      duration: activityData.duration || 0,
      breaks: activityData.breaks || 0
    };
  }
}

import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import { HiNATAEnrichmentRequest, HiNATAEnrichmentResponse, HiNATARecord } from './HiNATAService';
import { Logger } from '../utils/Logger';

// Mock ByenatOS服务，用于演示和测试
export class ByenatOSService {
  private apiKey: string;
  private baseUrl: string;
  public http: AxiosInstance;

  constructor(apiKey: string = '', baseUrl: string = 'https://api.byenatos.org') {
    this.apiKey = apiKey || process.env.BYENATOS_API_KEY || '';
    this.baseUrl = process.env.BYENATOS_BASE_URL || baseUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
    });
  }

  // 获取当前 PSP（供 Prompt 组合与对话上下文使用）
  async getCurrentPSP(params?: { UserId?: string; AppId?: string; Scope?: 'account' | 'app' }): Promise<string | any> {
    try {
      const resp = await this.http.get('/api/psp/current', { params });
      return resp.data;
    } catch (error) {
      Logger.warn('获取PSP失败:', error);
      return '';
    }
  }

  // 真实算子：调用 byenatOS 本地 HiNATA 增强
  async enrichHiNATA(request: HiNATAEnrichmentRequest): Promise<HiNATAEnrichmentResponse> {
    try {
      const resp = await this.http.post('/api/hinata/submit', {
        Mode: 'Enrich',
        Content: request.Content,
        Language: request.Language,
        MaxHighlights: request.MaxHighlights,
        ExtractHighlights: request.ExtractHighlights,
        GenerateSemanticTags: request.GenerateSemanticTags
      });

      const data = resp.data || {};
      // 规范化输出，保证兼容性
      return {
        Tags: (data.Tags || data.tags || []).map((t: any) => ({ Tag: t.Tag || t.tag || String(t), Score: t.Score || t.score || 0 })),
        Highlights: (data.Highlights || data.highlights || []).map((h: any) => ({
          Start: h.Start ?? h.start ?? 0,
          End: h.End ?? h.end ?? 0,
          Confidence: h.Confidence ?? h.confidence ?? 0.0,
          Reason: h.Reason ?? h.reason ?? ''
        })),
        Summary: data.Summary || data.summary || '',
        KeyPoints: data.KeyPoints || data.keyPoints || data.keywords || [],
        Vector: data.Vector || data.vector || [],
        QualityScore: data.QualityScore || data.qualityScore || 0.0,
        Valid: data.Valid ?? true,
        Errors: data.Errors
      } as HiNATAEnrichmentResponse;
    } catch (error) {
      Logger.error('调用byenatOS增强失败，回退到本地Mock:', error);
      // 回退：与现有Mock一致
      return {
        Tags: [ { Tag: 'AI', Score: 0.9 }, { Tag: '技术', Score: 0.8 } ],
        Highlights: [ { Start: 0, End: 50, Confidence: 0.85, Reason: '包含关键信息' } ],
        Summary: '本地回退摘要',
        KeyPoints: ['要点1','要点2'],
        Vector: Array.from({ length: 128 }, () => Math.random()),
        QualityScore: 0.7,
        Valid: true
      };
    }
  }

  // 真实算子：调用 byenatOS 校验 HiNATA
  async validateHiNATA(hinataRecord: HiNATARecord): Promise<{ Valid: boolean; Errors?: string[] }> {
    try {
      const resp = await this.http.post('/api/hinata/submit', {
        Mode: 'ValidateOnly',
        Record: hinataRecord
      });
      const data = resp.data || {};
      return { Valid: Boolean(data.Valid), Errors: data.Errors };
    } catch (error) {
      Logger.warn('调用byenatOS验证失败，回退到本地基础校验:', error);
      // 回退：执行基础字段校验
      const errors: string[] = [];
      if (!hinataRecord.Id) errors.push('缺少 Id 字段');
      if (!hinataRecord.Timestamp) errors.push('缺少 Timestamp 字段');
      if (!hinataRecord.Source) errors.push('缺少 Source 字段');
      if (!hinataRecord.Highlight) errors.push('缺少 Highlight 字段');
      if (!hinataRecord.Note) errors.push('缺少 Note 字段');
      if (!hinataRecord.Address) errors.push('缺少 Address 字段');
      if (!Array.isArray(hinataRecord.Tag)) errors.push('Tag 必须是数组');
      if (!['private', 'public', 'shared'].includes(hinataRecord.Access as any)) {
        errors.push('Access 必须是 private, public 或 shared');
      }
      return { Valid: errors.length === 0, Errors: errors.length ? errors : undefined };
    }
  }

  async getPersonalizedPrompt(req: Request, res: Response): Promise<any> {
    try {
      const { userId, context, userContext, promptType, maxLength, style, purpose } = req.body;
      
      // 优先尝试从 byenatOS 获取 PSP（不传用户标识，遵循系统边界）；失败则回退到本地生成逻辑
      let pspText = '';
      try {
        const pspResp = await this.http.get('/api/psp/current');
        pspText = typeof pspResp.data === 'string' ? pspResp.data : JSON.stringify(pspResp.data);
      } catch (e) {
        Logger.warn('获取 PSP 失败，使用本地fallback:', e);
      }

      const finalPrompt = this.composePromptFromPsp({
        context,
        userContext,
        psp: pspText,
        promptType: promptType || 'general',
        style: style || 'friendly',
        purpose,
        maxLength: maxLength || 1000
      });

      const response = {
        prompt: finalPrompt,
        metadata: {
          userId,
          promptType: promptType || 'general',
          style: style || 'friendly',
          generatedAt: new Date().toISOString(),
          source: pspText ? 'byenatOS+local' : 'local-only',
          confidence: pspText ? 0.9 : 0.8
        }
      };

      Logger.info(`生成个性化prompt - 用户: ${userId}, 类型: ${promptType}`);
      return response;
    } catch (error) {
      Logger.error('生成个性化prompt失败:', error);
      throw new Error('Prompt生成失败');
    }
  }

  async updateActivity(req: Request, res: Response): Promise<any> {
    try {
      const { userId, activity } = req.body;

      // Mock 实现 - 更新用户活动
      const response = {
        success: true,
        activityId: `activity_${Date.now()}`,
        userId,
        updatedAt: new Date().toISOString(),
        insights: this.generateMockInsights(activity)
      };

      Logger.info(`更新用户活动 - 用户: ${userId}, 活动类型: ${activity.type}`);
      return response;
    } catch (error) {
      Logger.error('更新用户活动失败:', error);
      throw new Error('活动更新失败');
    }
  }

  async analyzeContent(req: Request, res: Response): Promise<any> {
    try {
      const { userId, content } = req.body;
      
      // 优先尝试调用 byenatOS 本地算子（如果提供相应 API），否则回退到本地 Mock
      try {
        const resp = await this.http.post('/api/hinata/submit', {
          Content: content,
          Mode: 'AnalyzeOnly'
        });
        Logger.info(`内容分析完成(byenatOS) - 用户: ${userId}, 内容长度: ${content.length}`);
        return {
          analysisId: `analysis_${Date.now()}`,
          userId,
          content: content.substring(0, 100) + '...',
          analysis: resp.data,
          model: 'byenatOS-local',
          processingTime: 0,
          analyzedAt: new Date().toISOString()
        };
      } catch {
        const analysis = this.generateMockContentAnalysis(content);
        const response = {
          analysisId: `analysis_${Date.now()}`,
          userId,
          content: content.substring(0, 100) + '...',
          analysis,
          model: 'byenatOS-mock',
          processingTime: Math.random() * 1000 + 500,
          analyzedAt: new Date().toISOString()
        };
        Logger.info(`内容分析完成(Mock) - 用户: ${userId}, 内容长度: ${content.length}`);
        return response;
      }
    } catch (error) {
      Logger.error('内容分析失败:', error);
      throw new Error('内容分析失败');
    }
  }

  async analyzeFocus(req: Request, res: Response): Promise<any> {
    try {
      const { userId, activityData } = req.body;

      // Mock 实现 - 专注度分析
      const focusAnalysis = this.generateMockFocusAnalysis(activityData);

      const response = {
        analysisId: `focus_${Date.now()}`,
        userId,
        analysis: focusAnalysis,
        model: 'byenatOS-mock',
        analyzedAt: new Date().toISOString()
      };

      Logger.info(`专注度分析完成 - 用户: ${userId}, 分数: ${focusAnalysis.focusScore}`);
      return response;
    } catch (error) {
      Logger.error('专注度分析失败:', error);
      throw new Error('专注度分析失败');
    }
  }

  // 私有方法 - Mock实现
  private generateMockPrompt(context: string, promptType: string, style: string, purpose: string): string {
    const templates = {
      general: `作为一个AI助手，我将基于以下背景信息为您提供帮助：${context}`,
      creative: `让我们一起探索创意的世界！基于"${context}"这个主题，我们可以从多个角度来思考...`,
      analytical: `让我们系统性地分析"${context}"这个主题，从数据、逻辑和证据的角度来探讨...`,
      conversational: `很高兴和您聊天！关于"${context}"这个话题，我想和您分享一些想法...`
    };

    const basePrompt = templates[promptType as keyof typeof templates] || templates.general;
    
    const styleModifiers = {
      formal: '请用正式、专业的语调回应。',
      casual: '请用轻松、友好的语调回应。',
      professional: '请用专业、准确的语调回应。',
      friendly: '请用友善、温暖的语调回应。'
    };

    const modifier = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.friendly;

    return `${basePrompt}\n\n${modifier}\n\n请根据用户的个人偏好和历史记录，提供个性化的回应。`;
  }

  private composePromptFromPsp(params: {
    context: string;
    userContext?: string;
    psp?: string;
    promptType: string;
    style: string;
    purpose?: string;
    maxLength: number;
  }): string {
    const base = this.generateMockPrompt(params.context, params.promptType, params.style, params.purpose || '');
    const sections = [
      params.psp ? `【PSP】\n${params.psp}` : '',
      params.userContext ? `【UserContext】\n${params.userContext}` : '',
      `【Task】\n请根据以上信息生成高质量的系统提示词，用于指导后续在线大模型推理。最大长度 ${params.maxLength} 字符。`
    ].filter(Boolean);
    return `${base}\n\n${sections.join('\n\n')}`.slice(0, params.maxLength + 2000);
  }

  private generateMockInsights(activity: any): any {
    return {
      productivity: Math.random() * 100,
      focus: Math.random() * 100,
      engagement: Math.random() * 100,
      recommendations: [
        '建议在专注时间内关闭通知',
        '考虑使用番茄工作法提高效率',
        '定期休息有助于保持专注力'
      ],
      patterns: {
        mostProductiveTime: '09:00-11:00',
        averageSessionLength: 45,
        interruptionFrequency: 'low'
      }
    };
  }

  private generateMockContentAnalysis(content: string): any {
    const wordCount = content.split(' ').length;
    const sentiment = Math.random() > 0.5 ? 'positive' : 'neutral';
    
    return {
      sentiment: {
        label: sentiment,
        score: Math.random() * 0.5 + 0.5,
        confidence: Math.random() * 0.3 + 0.7
      },
      topics: [
        { name: '技术', confidence: 0.8 },
        { name: '个人发展', confidence: 0.6 },
        { name: 'AI', confidence: 0.7 }
      ],
      keywords: [
        { word: 'AI', frequency: 3, importance: 0.9 },
        { word: '优化', frequency: 2, importance: 0.7 },
        { word: '体验', frequency: 4, importance: 0.8 }
      ],
      summary: content.substring(0, Math.min(200, content.length)) + (content.length > 200 ? '...' : ''),
      statistics: {
        wordCount,
        characterCount: content.length,
        sentenceCount: content.split('.').length,
        readingTime: Math.ceil(wordCount / 200) // 假设每分钟200词
      }
    };
  }

  private generateMockFocusAnalysis(activityData: any): any {
    const focusScore = Math.random() * 40 + 60; // 60-100分
    const isFocused = focusScore > 75;

    return {
      focusScore: Math.round(focusScore),
      isFocused,
      sessionQuality: isFocused ? 'high' : 'medium',
      distractions: Math.floor(Math.random() * 5),
      productivity: {
        completed: Math.floor(Math.random() * 8 + 2),
        planned: 10,
        efficiency: Math.round((focusScore / 100) * 100)
      },
      recommendations: isFocused 
        ? ['保持当前的专注状态', '适当休息以维持效率']
        : ['尝试关闭干扰源', '使用专注技巧如番茄工作法', '考虑调整工作环境'],
      insights: {
        bestFocusTime: '10:00-12:00',
        averageSessionLength: Math.round(Math.random() * 30 + 45),
        improvementAreas: ['减少中断', '优化工作环境']
      }
    };
  }
}
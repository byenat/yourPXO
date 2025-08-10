import { ByenatOSService } from './ByenatOSService';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

export interface AIAnalysisResult {
  id: string;
  contentId: string;
  userId: string;
  analysisType: string[];
  results: {
    sentiment?: {
      score: number;
      label: string;
      confidence: number;
    };
    keywords?: Array<{
      text: string;
      score: number;
      category?: string;
    }>;
    topics?: Array<{
      text: string;
      score: number;
      category?: string;
    }>;
    entities?: Array<{
      text: string;
      type: string;
      confidence: number;
    }>;
    summary?: {
      text: string;
      length: number;
      keyPoints: string[];
    };
    language?: {
      detected: string;
      confidence: number;
    };
  };
  model: string;
  processingTime: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  context?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class AIService {
  private database: Database;
  private byenatOSService: ByenatOSService;

  constructor() {
    this.database = new Database();
    this.byenatOSService = new ByenatOSService();
    
    // 统一商业模式：禁用本地 LLM 调用，仅通过 ByenatOS 编排外部模型
  }

  // 内容分析
  async analyzeContent(userId: string, request: {
    contentId: string;
    analysisType: string[];
    options?: any;
  }): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 获取内容
      const content = await this.database.getContentById(userId, request.contentId);
      if (!content) {
        throw new Error('内容不存在');
      }

      const analysisId = uuidv4();
      const results: any = {};

      // 根据分析类型执行不同的分析
      for (const type of request.analysisType) {
        switch (type) {
          case 'sentiment':
            results.sentiment = await this.analyzeSentimentInternal(content.content);
            break;
          case 'keywords':
            results.keywords = await this.extractKeywordsInternal(content.content, request.options?.maxKeywords || 10);
            break;
          case 'topics':
            results.topics = await this.extractTopicsInternal(content.content, request.options?.maxTopics || 5);
            break;
          case 'entities':
            results.entities = await this.extractEntitiesInternal(content.content);
            break;
          case 'summary':
            results.summary = await this.generateSummaryInternal(content.content, request.options?.summaryLength || 200);
            break;
          case 'language':
            results.language = await this.detectLanguageInternal(content.content);
            break;
        }
      }

      const processingTime = Date.now() - startTime;
      const model = this.selectBestModel(content.content, request.analysisType);

      const analysisResult: AIAnalysisResult = {
        id: analysisId,
        contentId: request.contentId,
        userId,
        analysisType: request.analysisType,
        results,
        model,
        processingTime,
        createdAt: new Date()
      };

      // 保存分析结果
      await this.database.saveAIAnalysis(analysisResult);

      Logger.info(`AI分析完成 - 用户: ${userId}, 内容: ${request.contentId}, 耗时: ${processingTime}ms`);
      return analysisResult;
    } catch (error) {
      Logger.error('AI内容分析失败:', error);
      throw new Error('内容分析失败');
    }
  }

  // 生成个性化prompt
  async generatePersonalizedPrompt(userId: string, request: {
    context: string;
    promptType?: string;
    includeHistory?: boolean;
    maxLength?: number;
    style?: string;
    purpose?: string;
  }): Promise<{ prompt: string; metadata: any }> {
    try {
      // 获取用户历史数据用于个性化
      let userContext = '';
      if (request.includeHistory) {
        userContext = await this.getUserContextForPrompt(userId);
      }

      // 使用byenatOS生成个性化prompt
      const promptResponse = await this.byenatOSService.getPersonalizedPrompt({
        body: {
          userId,
          context: request.context,
          userContext,
          promptType: request.promptType || 'general',
          maxLength: request.maxLength || 1000,
          style: request.style || 'friendly',
          purpose: request.purpose
        }
      } as any, {} as any);

      Logger.info(`为用户 ${userId} 生成个性化prompt`);
      return promptResponse;
    } catch (error) {
      Logger.error('生成个性化prompt失败:', error);
      throw new Error('prompt生成失败');
    }
  }

  // AI对话
  async chat(userId: string, request: {
    message: string;
    conversationId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    contextWindow?: number;
    includePersonalContext?: boolean;
    responseFormat?: string;
    AppId?: string;
    Scope?: 'account' | 'app';
  }): Promise<{ response: string; conversationId: string; usage?: any; billing?: any }> {
    try {
      let conversation: Conversation;
      
      // 获取或创建对话
      if (request.conversationId) {
        conversation = await this.database.getConversation(userId, request.conversationId);
        if (!conversation) {
          throw new Error('对话不存在');
        }
      } else {
        conversation = {
          id: uuidv4(),
          userId,
          title: request.message.substring(0, 50) + '...',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: request.message,
        timestamp: new Date()
      };
      conversation.messages.push(userMessage);

      // 准备对话上下文
      const contextMessages = conversation.messages
        .slice(-(request.contextWindow || 10))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // 添加个人化上下文
      if (request.includePersonalContext) {
        const personalContext = await this.getUserContextForChat(userId);
        if (personalContext) {
          contextMessages.unshift({
            role: 'system',
            content: personalContext
          });
        }
      }

      // 统一由 ByenatOS 选择最优外部模型（auto），不在 yourPXO 本地做模型选择
      let response: string;
      let usage: any;
      let billing: any;

      // 通过 ByenatOS 的对话编排接口
      try {
        const llmResp = await this.callByenatOSChat(userId, {
          Question: request.message,
          Context: { messages: contextMessages },
          ModelPreference: undefined, // 由 ByenatOS 执行 auto 选择
          Format: (request.responseFormat as 'text' | 'markdown' | 'json') || 'text',
          AppId: request.AppId,
          Scope: request.Scope || 'account'
        });
        response = llmResp.Answer || '';
        usage = llmResp.Usage;
        billing = llmResp.Billing;
      } catch (e) {
        // 统一商业模式：不做本地降级，直接抛错
        throw new Error('LLM服务暂不可用，请稍后重试');
      }

      // 添加AI回复
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: { usage, billing }
      };
      conversation.messages.push(assistantMessage);
      conversation.updatedAt = new Date();

      // 保存对话
      await this.database.saveConversation(conversation);

      Logger.info(`AI对话 - 用户: ${userId}, 对话: ${conversation.id}`);
      return { response, conversationId: conversation.id, usage, billing };
    } catch (error) {
      Logger.error('AI对话失败:', error);
      throw new Error('AI对话失败');
    }
  }

  // 获取用户AI记忆
  async getUserMemory(userId: string): Promise<any> {
    try {
      return await this.database.getUserAIMemory(userId);
    } catch (error) {
      Logger.error('获取用户AI记忆失败:', error);
      throw new Error('获取AI记忆失败');
    }
  }

  // 更新用户AI记忆
  async updateUserMemory(userId: string, memory: any): Promise<any> {
    try {
      const updatedMemory = await this.database.updateUserAIMemory(userId, memory);
      Logger.info(`更新用户 ${userId} 的AI记忆`);
      return updatedMemory;
    } catch (error) {
      Logger.error('更新用户AI记忆失败:', error);
      throw new Error('更新AI记忆失败');
    }
  }

  // 其他方法...
  async summarizeContent(userId: string, contentId: string, maxLength: number): Promise<{ summary: string }> {
    try {
      const content = await this.database.getContentById(userId, contentId);
      if (!content) {
        throw new Error('内容不存在');
      }

      const summary = await this.generateSummaryInternal(content.content, maxLength);
      return { summary: summary.text };
    } catch (error) {
      Logger.error('生成摘要失败:', error);
      throw new Error('摘要生成失败');
    }
  }

  async extractKeywords(userId: string, contentId: string, maxKeywords: number): Promise<{ keywords: any[] }> {
    try {
      const content = await this.database.getContentById(userId, contentId);
      if (!content) {
        throw new Error('内容不存在');
      }

      const keywords = await this.extractKeywordsInternal(content.content, maxKeywords);
      return { keywords };
    } catch (error) {
      Logger.error('提取关键词失败:', error);
      throw new Error('关键词提取失败');
    }
  }

  async analyzeSentiment(userId: string, contentId: string): Promise<{ sentiment: any }> {
    try {
      const content = await this.database.getContentById(userId, contentId);
      if (!content) {
        throw new Error('内容不存在');
      }

      const sentiment = await this.analyzeSentimentInternal(content.content);
      return { sentiment };
    } catch (error) {
      Logger.error('情感分析失败:', error);
      throw new Error('情感分析失败');
    }
  }

  async generateKnowledgeGraph(userId: string, type: string, limit: number): Promise<any> {
    try {
      // TODO: 实现知识图谱生成
      return { nodes: [], edges: [] };
    } catch (error) {
      Logger.error('生成知识图谱失败:', error);
      throw new Error('知识图谱生成失败');
    }
  }

  async getRecommendations(userId: string, type: string, limit: number): Promise<any> {
    try {
      // TODO: 实现个性化推荐
      return { recommendations: [] };
    } catch (error) {
      Logger.error('获取推荐失败:', error);
      throw new Error('获取推荐失败');
    }
  }

  async analyzeFocus(userId: string, activityData: any): Promise<any> {
    try {
      return await this.byenatOSService.analyzeFocus({
        body: {
          userId,
          activityData
        }
      } as any, {} as any);
    } catch (error) {
      Logger.error('专注度分析失败:', error);
      throw new Error('专注度分析失败');
    }
  }

  // 私有方法
  // 统一由 ByenatOS 进行 auto 模型选择，yourPXO 不再本地判定
  private selectBestModel(content: string, analysisTypes: string[]): string {
    return 'auto';
  }

  private async getUserContextForPrompt(userId: string): Promise<string> {
    try {
      // 获取用户最近的内容和偏好
      const recentContents = await this.database.getRecentContents(userId, 10);
      const userPreferences = await this.database.getUserPreferences(userId);
      
      return `用户偏好: ${JSON.stringify(userPreferences)}\n最近内容: ${recentContents.map(c => c.title).join(', ')}`;
    } catch (error) {
      Logger.error('获取用户上下文失败:', error);
      return '';
    }
  }

  private async getUserContextForChat(userId: string): Promise<string> {
    try {
      const userProfile = await this.database.getUserProfile(userId);
      const recentTopics = await this.database.getUserRecentTopics(userId, 5);
      
      return `你是${userProfile.name}的个人AI助手。用户最近关注的话题：${recentTopics.join(', ')}。请以友好、个性化的方式回应。`;
    } catch (error) {
      Logger.error('获取聊天上下文失败:', error);
      return '你是一个友好的AI助手。';
    }
  }

  private async generateByenatOSResponse(
    userId: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    request: {
      temperature?: number;
      maxTokens?: number;
      includePersonalContext?: boolean;
      responseFormat?: string;
    }
  ): Promise<string> {
    try {
      // 1) 获取 PSP（由 byenatOS 提供，负责在线模型前的敏感信息隔离）
      const psp = await this.byenatOSService.getCurrentPSP();

      // 2) 个人化上下文
      const personalContext = request.includePersonalContext
        ? await this.getUserContextForChat(userId)
        : '';

      // 3) 组装 System Prompt（PSP + 个人上下文）
      const systemPrompt = this.composeSystemPromptFromPSP(psp, personalContext);

      // 不再本地调用大模型，也不提供降级回复
      throw new Error('LLM服务暂不可用');
    } catch (error) {
      // 6) 容错：发生错误时的简化降级
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      return `（临时回复）我已记录你的请求：${lastUser?.content?.slice(0, 200) || ''}。稍后将基于本地个性化设置继续处理。`;
    }
  }

  private composeSystemPromptFromPSP(psp: any, personalContext: string): string {
    const pspText = typeof psp === 'string' ? psp : JSON.stringify(psp);
    const sections = [
      '你是用户的个人AI助手，请严格依据以下个性化系统提示（PSP）进行对话与决策。',
      `【PSP】\n${pspText}`,
      personalContext ? `【UserContext】\n${personalContext}` : '',
      '请用中文回答，注重简洁准确；涉及建议时给出可执行步骤。'
    ].filter(Boolean);
    return sections.join('\n\n');
  }

  // AI分析的内部实现
  private async analyzeSentimentInternal(content: string): Promise<any> {
    // TODO: 实现情感分析
    return {
      score: 0.5,
      label: 'neutral',
      confidence: 0.8
    };
  }

  private async extractKeywordsInternal(content: string, maxKeywords: number): Promise<any[]> {
    // TODO: 实现关键词提取
    return [];
  }

  private async extractTopicsInternal(content: string, maxTopics: number): Promise<any[]> {
    // TODO: 实现主题提取
    return [];
  }

  private async extractEntitiesInternal(content: string): Promise<any[]> {
    // TODO: 实现实体识别
    return [];
  }

  private async generateSummaryInternal(content: string, maxLength: number): Promise<any> {
    // TODO: 实现摘要生成
    return {
      text: content.substring(0, maxLength),
      length: Math.min(content.length, maxLength),
      keyPoints: []
    };
  }

  private async detectLanguageInternal(content: string): Promise<any> {
    // TODO: 实现语言检测
    return {
      detected: 'zh-CN',
      confidence: 0.9
    };
  }

  // 新增：统一 ByenatOS 对话编排接口调用
  private async callByenatOSChat(userId: string, body: {
    Question: string;
    Context?: any;
    ModelPreference?: { Provider?: 'openai' | 'anthropic' | 'auto'; Model?: string };
    Format?: 'text' | 'markdown' | 'json';
    AppId?: string;
    Scope?: 'account' | 'app';
  }): Promise<{ Answer: string; Usage?: any; Billing?: any; Hinata?: any }> {
    try {
      const resp = await (this.byenatOSService as any).http.post('/api/llm/chat', body, {
        headers: { 'X-User-Id': userId }
      });
      return resp.data;
    } catch (error) {
      Logger.error('调用 ByenatOS /api/llm/chat 失败:', error);
      throw error;
    }
  }
}

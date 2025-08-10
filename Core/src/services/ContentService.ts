import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';
import { AIService } from './AIService';

export interface ContentItem {
  id: string;
  userId: string;
  type: 'diary' | 'document' | 'web' | 'social' | 'readlater' | 'glasses';
  title?: string;
  content: string;
  metadata: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
}

export interface DiaryEntry {
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  weather?: {
    temperature?: number;
    condition?: string;
    humidity?: number;
  };
}

export class ContentService {
  private database: Database;
  private aiService: AIService;

  constructor() {
    this.database = new Database();
    this.aiService = new AIService();
  }

  // 1. 个人日记记录
  async createDiaryEntry(userId: string, entry: DiaryEntry): Promise<ContentItem> {
    try {
      const id = uuidv4();
      const now = new Date();

      const contentItem: ContentItem = {
        id,
        userId,
        type: 'diary',
        title: entry.title,
        content: entry.content,
        metadata: {
          mood: entry.mood,
          location: entry.location,
          weather: entry.weather
        },
        tags: entry.tags || [],
        createdAt: now,
        updatedAt: now,
        isPrivate: entry.isPrivate !== false
      };

      await this.database.saveContent(contentItem);

      // 异步进行AI分析
      this.analyzeContentAsync(userId, id);

      Logger.info(`用户 ${userId} 创建日记条目: ${id}`);
      return contentItem;
    } catch (error) {
      Logger.error('创建日记条目失败:', error);
      throw new Error('创建日记失败');
    }
  }

  async getDiaryEntries(userId: string, options: {
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: ContentItem[]; total: number; page: number; totalPages: number }> {
    try {
      const result = await this.database.getContentsByType(userId, 'diary', options);
      return result;
    } catch (error) {
      Logger.error('获取日记条目失败:', error);
      throw new Error('获取日记失败');
    }
  }

  // 2. 文档处理
  async processDocument(userId: string, file: Express.Multer.File, metadata: any): Promise<ContentItem> {
    try {
      const id = uuidv4();
      let extractedText = '';

      // 根据文件类型提取文本
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === 'text/plain') {
        extractedText = file.buffer.toString('utf-8');
      }
      // TODO: 添加EPUB和DOCX支持

      const contentItem: ContentItem = {
        id,
        userId,
        type: 'document',
        title: metadata.title || file.originalname,
        content: extractedText,
        metadata: {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          category: metadata.category,
          description: metadata.description,
          extractText: metadata.extractText,
          generateSummary: metadata.generateSummary
        },
        tags: metadata.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: metadata.isPrivate !== false
      };

      await this.database.saveContent(contentItem);

      // 异步进行AI分析和摘要生成
      if (metadata.generateSummary) {
        this.analyzeContentAsync(userId, id);
      }

      Logger.info(`用户 ${userId} 上传文档: ${id}`);
      return contentItem;
    } catch (error) {
      Logger.error('处理文档失败:', error);
      throw new Error('文档处理失败');
    }
  }

  // 3. 网页内容捕获
  async captureWebContent(userId: string, data: {
    url: string;
    title?: string;
    content: string;
    metadata?: any;
    tags?: string[];
  }): Promise<ContentItem> {
    try {
      const id = uuidv4();

      const contentItem: ContentItem = {
        id,
        userId,
        type: 'web',
        title: data.title,
        content: data.content,
        metadata: {
          url: data.url,
          captureTime: new Date(),
          ...data.metadata
        },
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: true
      };

      await this.database.saveContent(contentItem);

      // 异步进行AI分析
      this.analyzeContentAsync(userId, id);

      Logger.info(`用户 ${userId} 捕获网页内容: ${id}`);
      return contentItem;
    } catch (error) {
      Logger.error('捕获网页内容失败:', error);
      throw new Error('网页内容捕获失败');
    }
  }

  // 4. 标注创建
  async createAnnotation(userId: string, data: {
    contentId: string;
    contentType: string;
    annotationType: string;
    selection?: any;
    note?: string;
    tags?: string[];
    color?: string;
    isPrivate?: boolean;
  }): Promise<any> {
    try {
      const annotationId = uuidv4();
      
      const annotation = {
        id: annotationId,
        userId,
        contentId: data.contentId,
        contentType: data.contentType,
        annotationType: data.annotationType,
        selection: data.selection,
        note: data.note,
        tags: data.tags || [],
        color: data.color,
        isPrivate: data.isPrivate !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.database.saveAnnotation(annotation);

      Logger.info(`用户 ${userId} 创建标注: ${annotationId}`);
      return annotation;
    } catch (error) {
      Logger.error('创建标注失败:', error);
      throw new Error('标注创建失败');
    }
  }

  // 5. 社交媒体内容处理
  async processSocialMediaContent(userId: string, data: {
    platform: string;
    contentType: string;
    originalUrl?: string;
    content: string;
    author?: any;
    metadata?: any;
    tags?: string[];
  }): Promise<ContentItem> {
    try {
      const id = uuidv4();

      const contentItem: ContentItem = {
        id,
        userId,
        type: 'social',
        title: `${data.platform} - ${data.contentType}`,
        content: data.content,
        metadata: {
          platform: data.platform,
          contentType: data.contentType,
          originalUrl: data.originalUrl,
          author: data.author,
          ...data.metadata
        },
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: true
      };

      await this.database.saveContent(contentItem);

      // 异步进行AI分析
      this.analyzeContentAsync(userId, id);

      Logger.info(`用户 ${userId} 处理社交媒体内容: ${id}`);
      return contentItem;
    } catch (error) {
      Logger.error('处理社交媒体内容失败:', error);
      throw new Error('社交媒体内容处理失败');
    }
  }

  // 6. ReadItLater同步
  async syncReadLaterItems(userId: string, service: string, accessToken: string): Promise<ContentItem[]> {
    try {
      // TODO: 实现Pocket/Instapaper API集成
      const items: ContentItem[] = [];
      
      Logger.info(`用户 ${userId} 同步 ${service} 内容`);
      return items;
    } catch (error) {
      Logger.error('同步ReadItLater失败:', error);
      throw new Error('ReadItLater同步失败');
    }
  }

  // 7. 智能眼镜图片处理
  async processGlassesCapture(userId: string, file: Express.Multer.File, metadata: any): Promise<ContentItem> {
    try {
      const id = uuidv4();

      // TODO: 实现OCR和图像识别
      const extractedText = ''; // OCR结果

      const contentItem: ContentItem = {
        id,
        userId,
        type: 'glasses',
        title: metadata.title || `眼镜拍照 - ${new Date().toLocaleString()}`,
        content: extractedText,
        metadata: {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          location: metadata.location,
          timestamp: metadata.timestamp,
          deviceInfo: metadata.deviceInfo
        },
        tags: metadata.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: true
      };

      await this.database.saveContent(contentItem);

      Logger.info(`用户 ${userId} 处理眼镜拍照: ${id}`);
      return contentItem;
    } catch (error) {
      Logger.error('处理眼镜拍照失败:', error);
      throw new Error('眼镜拍照处理失败');
    }
  }

  // 通用方法
  async getDocument(userId: string, documentId: string): Promise<ContentItem | null> {
    try {
      return await this.database.getContentById(userId, documentId);
    } catch (error) {
      Logger.error('获取文档失败:', error);
      throw new Error('获取文档失败');
    }
  }

  async getContents(userId: string, options: {
    type?: string;
    page: number;
    limit: number;
    search?: string;
    tags?: string;
  }): Promise<{ items: ContentItem[]; total: number; page: number; totalPages: number }> {
    try {
      return await this.database.getContents(userId, options);
    } catch (error) {
      Logger.error('获取内容列表失败:', error);
      throw new Error('获取内容失败');
    }
  }

  async searchContents(userId: string, options: {
    query: string;
    type?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ContentItem[]; total: number; page: number; totalPages: number }> {
    try {
      return await this.database.searchContents(userId, options);
    } catch (error) {
      Logger.error('搜索内容失败:', error);
      throw new Error('内容搜索失败');
    }
  }

  async getContentById(userId: string, contentId: string): Promise<ContentItem | null> {
    try {
      return await this.database.getContentById(userId, contentId);
    } catch (error) {
      Logger.error('获取内容详情失败:', error);
      throw new Error('获取内容失败');
    }
  }

  async deleteContent(userId: string, contentId: string): Promise<void> {
    try {
      await this.database.deleteContent(userId, contentId);
      Logger.info(`用户 ${userId} 删除内容: ${contentId}`);
    } catch (error) {
      Logger.error('删除内容失败:', error);
      throw new Error('删除内容失败');
    }
  }

  // 私有方法：异步AI分析
  private async analyzeContentAsync(userId: string, contentId: string): Promise<void> {
    try {
      // 异步执行，不阻塞主流程
      setTimeout(async () => {
        try {
          await this.aiService.analyzeContent(userId, {
            contentId,
            analysisType: ['sentiment', 'keywords', 'topics', 'summary']
          });
        } catch (error) {
          Logger.error('异步AI分析失败:', error);
        }
      }, 100);
    } catch (error) {
      Logger.error('启动异步分析失败:', error);
    }
  }
}

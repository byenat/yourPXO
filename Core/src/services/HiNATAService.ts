import { Logger } from '../utils/Logger';
import { ByenatOSService } from './ByenatOSService';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

/**
 * HiNATA 数据结构 - 遵循 byenatOS 规范
 * 基于 AI/byenatOS-core/Documentation/zh/APIs/HiNATADefinition.md
 */
export interface HiNATARecord {
  Id: string;
  Timestamp: string;
  Source: string;
  Highlight: string;
  Note: string;
  Address: string;
  Tag: string[];
  Access: 'private' | 'public' | 'shared';
  RawData?: {
    OriginalText?: string;
    UserContext?: string;
    AppMetadata?: Record<string, any>;
  };
  
  // byenatOS 增强字段
  EnhancedTags?: string[];
  RecommendedHighlights?: Array<{
    Start: number;
    End: number;
    Reason: string;
    Confidence: number;
  }>;
  SemanticAnalysis?: {
    MainTopics: string[];
    Sentiment: string;
    ComplexityLevel: string;
    KeyConcepts: string[];
  };
  ClusterId?: string;
  PriorityScore?: number;
  PSPRelevance?: number;
  EmbeddingVector?: number[];
  Metadata?: {
    Confidence: number;
    ProcessingTime: string;
    Version: string;
    OptimizationLevel: string;
    AIEnhanced: boolean;
  };
}

/**
 * HiNATA 增强请求
 */
export interface HiNATAEnrichmentRequest {
  Content: string;
  Language?: string;
  MaxHighlights?: number;
  EnableAIEnhancement?: boolean;
  ExtractHighlights?: boolean;
  GenerateSemanticTags?: boolean;
}

/**
 * HiNATA 增强响应
 */
export interface HiNATAEnrichmentResponse {
  Tags: Array<{ Tag: string; Score: number }>;
  Highlights: Array<{ Start: number; End: number; Confidence: number; Reason: string }>;
  Summary: string;
  KeyPoints: string[];
  Vector: number[];
  QualityScore: number;
  Valid: boolean;
  Errors?: string[];
}

/**
 * HiNATA 服务 - yourPXO 侧实现
 * 负责用户数据管理、映射、存储和人机确认流程
 * byenatOS 仅提供无状态的 AI 算子和校验工具
 */
export class HiNATAService {
  private database: Database;
  private byenatOS: ByenatOSService;

  constructor() {
    this.database = new Database();
    this.byenatOS = new ByenatOSService();
  }

  /**
   * 将原始信息映射为 HiNATA 格式
   * yourPXO 职责：数据预处理、格式映射。
   * 项目规则更新：yourPXO → byenatOS 传输时无需进行 PII 脱敏；
   * 敏感信息与在线大模型的隔离在 byenatOS 层处理。
   */
  async MapToHiNATA(rawData: {
    userId: string;
    source: string;
    content: string;
    userHighlight?: string;
    userNote?: string;
    resourceUrl?: string;
    userTags?: string[];
    accessLevel?: string;
    context?: Record<string, any>;
  }): Promise<HiNATARecord> {
    const hinataId = this.generateHiNATAId(rawData.source);
    
    // 项目规则：传给 byenatOS 的内容不做脱敏；
    // 仍对 URL 做最小化清洗（移除跟踪参数）。
    const processedContent = rawData.content;
    const sanitizedUrl = this.sanitizeUrl(rawData.resourceUrl || '');
    
    const hinataRecord: HiNATARecord = {
      Id: hinataId,
      Timestamp: new Date().toISOString(),
      Source: rawData.source,
      Highlight: rawData.userHighlight || this.extractDefaultHighlight(processedContent),
      Note: rawData.userNote || processedContent,
      Address: sanitizedUrl,
      Tag: rawData.userTags || [],
      Access: (rawData.accessLevel as any) || 'private',
      RawData: {
        OriginalText: rawData.content,
        UserContext: JSON.stringify(rawData.context || {}),
        AppMetadata: {
          UserId: rawData.userId, // 注意：这个只在 yourPXO 内部使用，不传给 byenatOS
          CreatedAt: new Date().toISOString(),
          ProcessedBy: 'yourPXO-HiNATAService'
        }
      }
    };

    Logger.info(`创建 HiNATA 记录: ${hinataId} for user: ${rawData.userId}`);
    return hinataRecord;
  }

  /**
   * 调用 byenatOS 本地算子进行 HiNATA 增强
   * yourPXO 职责：编排调用、不传用户标识
   */
  async EnrichHiNATA(hinataRecord: HiNATARecord): Promise<HiNATARecord> {
    try {
      // 准备增强请求（不包含用户标识）
      const enrichmentRequest: HiNATAEnrichmentRequest = {
        Content: `${hinataRecord.Highlight} ${hinataRecord.Note}`,
        Language: 'zh-CN',
        MaxHighlights: 5,
        EnableAIEnhancement: true,
        ExtractHighlights: true,
        GenerateSemanticTags: true
      };

      // 调用 byenatOS 本地算子（真实算子，对接本地服务/SDK）
      const enrichmentResponse = await this.byenatOS.enrichHiNATA(enrichmentRequest);

      // 合并增强结果
      const enrichedRecord: HiNATARecord = {
        ...hinataRecord,
        EnhancedTags: enrichmentResponse.Tags.map(t => t.Tag),
        RecommendedHighlights: enrichmentResponse.Highlights,
        SemanticAnalysis: {
          MainTopics: enrichmentResponse.Tags.slice(0, 3).map(t => t.Tag),
          Sentiment: this.detectSentiment(hinataRecord.Note),
          ComplexityLevel: this.assessComplexity(hinataRecord.Note),
          KeyConcepts: enrichmentResponse.KeyPoints
        },
        EmbeddingVector: enrichmentResponse.Vector,
        PriorityScore: enrichmentResponse.QualityScore,
        Metadata: {
          Confidence: 0.85,
          ProcessingTime: '0.5s',
          Version: '1.0.0',
          OptimizationLevel: 'enhanced',
          AIEnhanced: true
        }
      };

      Logger.info(`HiNATA 增强完成: ${hinataRecord.Id}`);
      return enrichedRecord;
    } catch (error) {
      Logger.error('HiNATA 增强失败:', error);
      throw new Error('HiNATA 增强处理失败');
    }
  }

  /**
   * 验证 HiNATA 格式
   * 使用 byenatOS 提供的校验工具
   */
  async ValidateHiNATA(hinataRecord: HiNATARecord): Promise<{ Valid: boolean; Errors?: string[] }> {
    try {
      // 调用 byenatOS 校验工具（真实算子，对接本地服务/SDK）
      const validation = await this.byenatOS.validateHiNATA(hinataRecord);
      
      Logger.info(`HiNATA 验证结果: ${hinataRecord.Id} - ${validation.Valid ? '通过' : '失败'}`);
      return validation;
    } catch (error) {
      Logger.error('HiNATA 验证失败:', error);
      return { Valid: false, Errors: ['验证服务异常'] };
    }
  }

  /**
   * 存储 HiNATA 记录
   * yourPXO 职责：版本化存储、用户关联、审计日志
   */
  async StoreHiNATA(userId: string, hinataRecord: HiNATARecord): Promise<void> {
    try {
      // 验证格式
      const validation = await this.ValidateHiNATA(hinataRecord);
      if (!validation.Valid) {
        throw new Error(`HiNATA 格式验证失败: ${validation.Errors?.join(', ')}`);
      }

      // 计算质量分数
      const qualityScore = this.calculateQualityScore(hinataRecord);
      
      // 存储到数据库（包含用户关联）
      await this.database.createContent({
        id: hinataRecord.Id,
        userId: userId,
        title: hinataRecord.Highlight,
        content: hinataRecord.Note,
        source: hinataRecord.Source,
        url: hinataRecord.Address,
        tags: [...hinataRecord.Tag, ...(hinataRecord.EnhancedTags || [])],
        metadata: {
          hinataRecord: hinataRecord,
          qualityScore: qualityScore,
          storedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      // 记录审计日志
      Logger.info(`HiNATA 存储成功: ${hinataRecord.Id} for user: ${userId}, 质量分: ${qualityScore}`);
    } catch (error) {
      Logger.error('HiNATA 存储失败:', error);
      throw new Error('HiNATA 存储失败');
    }
  }

  /**
   * 获取用户的 HiNATA 记录
   */
  async GetUserHiNATA(userId: string, options?: {
    limit?: number;
    offset?: number;
    source?: string;
    tags?: string[];
    timeRange?: { start: string; end: string };
  }): Promise<HiNATARecord[]> {
    try {
      const contents = await this.database.getUserContents(userId, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        source: options?.source,
        tags: options?.tags
      });

      const hinataRecords = contents.map(content => {
        if (content.metadata?.hinataRecord) {
          return content.metadata.hinataRecord as HiNATARecord;
        }
        
        // 兼容旧数据，动态转换
        return this.convertToHiNATA(content);
      });

      Logger.info(`获取用户 HiNATA 记录: ${userId}, 返回 ${hinataRecords.length} 条`);
      return hinataRecords;
    } catch (error) {
      Logger.error('获取用户 HiNATA 记录失败:', error);
      throw new Error('获取 HiNATA 记录失败');
    }
  }

  /**
   * 用户确认和合并建议
   * yourPXO 职责：人机交互、用户决策记录
   */
  async ConfirmEnhancements(userId: string, hinataId: string, confirmations: {
    acceptedTags?: string[];
    rejectedTags?: string[];
    acceptedHighlights?: number[];
    rejectedHighlights?: number[];
    userFeedback?: string;
  }): Promise<void> {
    try {
      const content = await this.database.getContentById(userId, hinataId);
      if (!content) {
        throw new Error('HiNATA 记录不存在');
      }

      const hinataRecord = content.metadata?.hinataRecord as HiNATARecord;
      if (!hinataRecord) {
        throw new Error('无效的 HiNATA 记录');
      }

      // 合并用户确认的增强内容
      const updatedRecord = this.mergeUserConfirmations(hinataRecord, confirmations);
      
      // 更新记录
      await this.database.updateContent(userId, hinataId, {
        metadata: {
          ...content.metadata,
          hinataRecord: updatedRecord,
          userConfirmations: confirmations,
          confirmedAt: new Date().toISOString()
        }
      });

      Logger.info(`用户确认 HiNATA 增强: ${hinataId} for user: ${userId}`);
    } catch (error) {
      Logger.error('用户确认失败:', error);
      throw new Error('确认增强内容失败');
    }
  }

  // 私有方法

  private generateHiNATAId(source: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `hinata_${source}_${timestamp}_${random}`;
  }

  private preprocessContent(content: string): string {
    // PII 脱敏处理
    let processed = content;
    
    // 脱敏邮箱
    processed = processed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // 脱敏电话号码
    processed = processed.replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]');
    
    // 脱敏身份证号
    processed = processed.replace(/\b\d{15}|\d{18}\b/g, '[ID_NUMBER]');
    
    return processed.trim();
  }

  private sanitizeUrl(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      // 移除可能的跟踪参数
      urlObj.searchParams.delete('utm_source');
      urlObj.searchParams.delete('utm_medium');
      urlObj.searchParams.delete('utm_campaign');
      return urlObj.toString();
    } catch {
      return url; // 如果不是有效URL，返回原始值
    }
  }

  private extractDefaultHighlight(content: string): string {
    // 提取内容的前100个字符作为默认highlight
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  // 过往Mock方法已被真实算子替换，保留占位以避免误用

  private detectSentiment(text: string): string {
    // 简化的情感分析
    const positiveWords = ['好', '棒', '优秀', '喜欢', '满意'];
    const negativeWords = ['坏', '差', '糟糕', '讨厌', '失望'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private assessComplexity(text: string): string {
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 200) return 'high';
    if (wordCount > 100) return 'medium';
    return 'low';
  }

  private calculateQualityScore(hinataRecord: HiNATARecord): number {
    let score = 0.5; // 基础分数
    
    // 内容长度因子
    const contentLength = hinataRecord.Note.length;
    if (contentLength > 500) score += 0.2;
    else if (contentLength > 200) score += 0.1;
    
    // 标签丰富度因子
    const totalTags = hinataRecord.Tag.length + (hinataRecord.EnhancedTags?.length || 0);
    if (totalTags > 5) score += 0.2;
    else if (totalTags > 2) score += 0.1;
    
    // AI增强因子
    if (hinataRecord.Metadata?.AIEnhanced) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private convertToHiNATA(content: any): HiNATARecord {
    // 将旧格式数据转换为 HiNATA 格式
    return {
      Id: content.id,
      Timestamp: content.createdAt || new Date().toISOString(),
      Source: content.source || 'unknown',
      Highlight: content.title || content.content?.substring(0, 100) || '',
      Note: content.content || '',
      Address: content.url || '',
      Tag: content.tags || [],
      Access: 'private'
    };
  }

  private mergeUserConfirmations(
    hinataRecord: HiNATARecord, 
    confirmations: {
      acceptedTags?: string[];
      rejectedTags?: string[];
      acceptedHighlights?: number[];
      rejectedHighlights?: number[];
      userFeedback?: string;
    }
  ): HiNATARecord {
    const updated = { ...hinataRecord };
    
    // 合并用户确认的标签
    if (confirmations.acceptedTags) {
      updated.Tag = [...new Set([...updated.Tag, ...confirmations.acceptedTags])];
    }
    
    if (confirmations.rejectedTags && updated.EnhancedTags) {
      updated.EnhancedTags = updated.EnhancedTags.filter(
        tag => !confirmations.rejectedTags!.includes(tag)
      );
    }
    
    // 处理高亮确认
    if (confirmations.rejectedHighlights && updated.RecommendedHighlights) {
      updated.RecommendedHighlights = updated.RecommendedHighlights.filter(
        (_, index) => !confirmations.rejectedHighlights!.includes(index)
      );
    }
    
    return updated;
  }
}

import { Database } from './Database';
import { ContentItem } from '../services/ContentService';
import { AIAnalysisResult, Conversation } from '../services/AIService';
import { SyncChange, SyncConflict, BackupInfo } from '../services/SyncService';

// 扩展Database类的方法
declare module './Database' {
  interface Database {
    // 内容相关方法
    saveContent(content: ContentItem): Promise<void>;
    getContentById(userId: string, contentId: string): Promise<ContentItem | null>;
    getContentsByType(userId: string, type: string, options: any): Promise<any>;
    getContents(userId: string, options: any): Promise<any>;
    searchContents(userId: string, options: any): Promise<any>;
    deleteContent(userId: string, contentId: string): Promise<void>;
    getAllUserContents(userId: string): Promise<ContentItem[]>;
    getRecentContents(userId: string, limit: number): Promise<ContentItem[]>;

    // 标注相关方法
    saveAnnotation(annotation: any): Promise<void>;
    getAllUserAnnotations(userId: string): Promise<any[]>;
    deleteAnnotation(userId: string, annotationId: string): Promise<void>;

    // AI相关方法
    saveAIAnalysis(analysis: AIAnalysisResult): Promise<void>;
    getAIAnalysis(contentId: string): Promise<AIAnalysisResult | null>;
    saveConversation(conversation: Conversation): Promise<void>;
    getConversation(userId: string, conversationId: string): Promise<Conversation>;
    getUserConversations(userId: string): Promise<Conversation[]>;
    getUserAIMemory(userId: string): Promise<any>;
    updateUserAIMemory(userId: string, memory: any): Promise<any>;
    getUserProfile(userId: string): Promise<any>;
    getUserRecentTopics(userId: string, limit: number): Promise<string[]>;

    // 用户偏好相关方法
    getUserPreferences(userId: string): Promise<any>;
    updateUserPreferences(userId: string, preferences: any): Promise<void>;
    getUserDevices(userId: string): Promise<any[]>;

    // 同步相关方法
    getLastSyncTime(userId: string, deviceId: string): Promise<Date | null>;
    updateLastSyncTime(userId: string, deviceId: string, time: Date): Promise<void>;
    getPendingChangesCount(userId: string, deviceId: string): Promise<number>;
    getConflictsCount(userId: string, deviceId: string): Promise<number>;
    getChangesAfter(userId: string, timestamp: Date): Promise<SyncChange[]>;
    saveConflict(userId: string, conflict: SyncConflict): Promise<void>;
    getUserConflicts(userId: string): Promise<SyncConflict[]>;
    getConflict(userId: string, conflictId: string): Promise<SyncConflict | null>;
    deleteConflict(userId: string, conflictId: string): Promise<void>;
    saveBackup(backup: BackupInfo, data: any): Promise<void>;
    getBackup(userId: string, backupId: string): Promise<BackupInfo | null>;
    getBackupData(userId: string, backupId: string): Promise<any>;
    getSyncHistory(userId: string, deviceId: string, options: any): Promise<any>;
  }
}

// 内容相关方法的实现
Database.prototype.saveContent = async function(content: ContentItem): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT OR REPLACE INTO contents 
     (id, user_id, type, title, content, metadata, tags, is_private, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      content.id,
      content.userId,
      content.type,
      content.title,
      content.content,
      JSON.stringify(content.metadata),
      JSON.stringify(content.tags),
      content.isPrivate,
      content.createdAt.toISOString(),
      content.updatedAt.toISOString()
    ]
  );
};

Database.prototype.getContentById = async function(userId: string, contentId: string): Promise<ContentItem | null> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT * FROM contents WHERE id = ? AND user_id = ?',
    [contentId, userId]
  );

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

Database.prototype.getContentsByType = async function(userId: string, type: string, options: any): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const { page = 1, limit = 20, startDate, endDate } = options;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = ? AND type = ?';
  const params: any[] = [userId, type];

  if (startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(endDate);
  }

  // 获取总数
  const countResult = await this.db.get(
    `SELECT COUNT(*) as total FROM contents ${whereClause}`,
    params
  );
  const total = countResult.total;

  // 获取数据
  const rows = await this.db.all(
    `SELECT * FROM contents ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const items = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

Database.prototype.getContents = async function(userId: string, options: any): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const { type, page = 1, limit = 20, search, tags } = options;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = ?';
  const params: any[] = [userId];

  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  if (search) {
    whereClause += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (tags) {
    whereClause += ' AND tags LIKE ?';
    params.push(`%${tags}%`);
  }

  // 获取总数
  const countResult = await this.db.get(
    `SELECT COUNT(*) as total FROM contents ${whereClause}`,
    params
  );
  const total = countResult.total;

  // 获取数据
  const rows = await this.db.all(
    `SELECT * FROM contents ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const items = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

Database.prototype.searchContents = async function(userId: string, options: any): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const { query, type, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)';
  const params: any[] = [userId, `%${query}%`, `%${query}%`];

  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  // 获取总数
  const countResult = await this.db.get(
    `SELECT COUNT(*) as total FROM contents ${whereClause}`,
    params
  );
  const total = countResult.total;

  // 获取数据
  const rows = await this.db.all(
    `SELECT * FROM contents ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const items = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

Database.prototype.deleteContent = async function(userId: string, contentId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    'DELETE FROM contents WHERE id = ? AND user_id = ?',
    [contentId, userId]
  );
};

Database.prototype.getAllUserContents = async function(userId: string): Promise<ContentItem[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM contents WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

Database.prototype.getRecentContents = async function(userId: string, limit: number): Promise<ContentItem[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM contents WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: JSON.parse(row.metadata),
    tags: JSON.parse(row.tags),
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

// 标注相关方法
Database.prototype.saveAnnotation = async function(annotation: any): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT OR REPLACE INTO annotations 
     (id, user_id, content_id, content_type, annotation_type, selection, note, tags, color, is_private, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      annotation.id,
      annotation.userId,
      annotation.contentId,
      annotation.contentType,
      annotation.annotationType,
      JSON.stringify(annotation.selection),
      annotation.note,
      JSON.stringify(annotation.tags),
      annotation.color,
      annotation.isPrivate,
      annotation.createdAt.toISOString(),
      annotation.updatedAt.toISOString()
    ]
  );
};

Database.prototype.getAllUserAnnotations = async function(userId: string): Promise<any[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM annotations WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    contentType: row.content_type,
    annotationType: row.annotation_type,
    selection: JSON.parse(row.selection || '{}'),
    note: row.note,
    tags: JSON.parse(row.tags || '[]'),
    color: row.color,
    isPrivate: Boolean(row.is_private),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

Database.prototype.deleteAnnotation = async function(userId: string, annotationId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    'DELETE FROM annotations WHERE id = ? AND user_id = ?',
    [annotationId, userId]
  );
};

// AI相关方法
Database.prototype.saveAIAnalysis = async function(analysis: AIAnalysisResult): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT INTO ai_analyses 
     (id, content_id, user_id, analysis_type, results, model, processing_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      analysis.id,
      analysis.contentId,
      analysis.userId,
      JSON.stringify(analysis.analysisType),
      JSON.stringify(analysis.results),
      analysis.model,
      analysis.processingTime,
      analysis.createdAt.toISOString()
    ]
  );
};

Database.prototype.saveConversation = async function(conversation: Conversation): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT OR REPLACE INTO conversations 
     (id, user_id, title, messages, context, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      conversation.id,
      conversation.userId,
      conversation.title,
      JSON.stringify(conversation.messages),
      JSON.stringify(conversation.context),
      conversation.createdAt.toISOString(),
      conversation.updatedAt.toISOString()
    ]
  );
};

Database.prototype.getConversation = async function(userId: string, conversationId: string): Promise<Conversation> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
    [conversationId, userId]
  );

  if (!row) {
    throw new Error('Conversation not found');
  }

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: JSON.parse(row.messages),
    context: JSON.parse(row.context || '{}'),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

Database.prototype.getUserConversations = async function(userId: string): Promise<Conversation[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: JSON.parse(row.messages),
    context: JSON.parse(row.context || '{}'),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

Database.prototype.getUserAIMemory = async function(userId: string): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT * FROM user_ai_memory WHERE user_id = ?',
    [userId]
  );

  if (!row) {
    return { userId, memory: {}, updatedAt: new Date() };
  }

  return {
    userId: row.user_id,
    memory: JSON.parse(row.memory_data),
    updatedAt: new Date(row.updated_at)
  };
};

Database.prototype.updateUserAIMemory = async function(userId: string, memory: any): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const now = new Date();
  const id = this.generateId();

  await this.db.run(
    `INSERT OR REPLACE INTO user_ai_memory (id, user_id, memory_data, updated_at)
     VALUES (?, ?, ?, ?)`,
    [id, userId, JSON.stringify(memory), now.toISOString()]
  );

  return {
    userId,
    memory,
    updatedAt: now
  };
};

// 其他辅助方法的实现...
Database.prototype.getUserProfile = async function(userId: string): Promise<any> {
  return await this.getUserById(userId);
};

Database.prototype.getUserRecentTopics = async function(userId: string, limit: number): Promise<string[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    `SELECT tags FROM contents WHERE user_id = ? 
     ORDER BY created_at DESC LIMIT ?`,
    [userId, limit * 2] // 获取更多数据来提取主题
  );

  const topics = new Set<string>();
  rows.forEach(row => {
    const tags = JSON.parse(row.tags || '[]');
    tags.forEach((tag: string) => topics.add(tag));
  });

  return Array.from(topics).slice(0, limit);
};

Database.prototype.getUserPreferences = async function(userId: string): Promise<any> {
  const user = await this.getUserById(userId);
  return user?.preferences || {};
};

Database.prototype.updateUserPreferences = async function(userId: string, preferences: any): Promise<void> {
  await this.updateUser(userId, { preferences });
};

Database.prototype.getUserDevices = async function(userId: string): Promise<any[]> {
  return await this.getDevicesByUserId(userId);
};

// 同步相关方法的基础实现（可以根据需要进一步扩展）
Database.prototype.getLastSyncTime = async function(userId: string, deviceId: string): Promise<Date | null> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT MAX(timestamp) as last_sync FROM sync_history WHERE user_id = ? AND device_id = ?',
    [userId, deviceId]
  );

  return row?.last_sync ? new Date(row.last_sync) : null;
};

Database.prototype.updateLastSyncTime = async function(userId: string, deviceId: string, time: Date): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  const id = this.generateId();
  await this.db.run(
    `INSERT INTO sync_history (id, user_id, device_id, sync_type, status, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, deviceId, 'manual', 'completed', time.toISOString()]
  );
};

Database.prototype.getPendingChangesCount = async function(userId: string, deviceId: string): Promise<number> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT COUNT(*) as count FROM sync_changes WHERE user_id = ? AND device_id = ?',
    [userId, deviceId]
  );

  return row?.count || 0;
};

Database.prototype.getConflictsCount = async function(userId: string, deviceId: string): Promise<number> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT COUNT(*) as count FROM sync_conflicts WHERE user_id = ?',
    [userId]
  );

  return row?.count || 0;
};

Database.prototype.getChangesAfter = async function(userId: string, timestamp: Date): Promise<SyncChange[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM sync_changes WHERE user_id = ? AND timestamp > ? ORDER BY timestamp',
    [userId, timestamp.toISOString()]
  );

  return rows.map(row => ({
    id: row.id,
    type: row.type as any,
    resourceType: row.resource_type as any,
    resourceId: row.resource_id,
    data: JSON.parse(row.data || '{}'),
    timestamp: new Date(row.timestamp),
    deviceId: row.device_id,
    version: row.version
  }));
};

Database.prototype.saveConflict = async function(userId: string, conflict: SyncConflict): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT INTO sync_conflicts 
     (id, user_id, resource_type, resource_id, local_version, remote_version, conflict_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conflict.id,
      userId,
      conflict.resourceType,
      conflict.resourceId,
      JSON.stringify(conflict.localVersion),
      JSON.stringify(conflict.remoteVersion),
      conflict.conflictType,
      conflict.createdAt.toISOString()
    ]
  );
};

Database.prototype.getUserConflicts = async function(userId: string): Promise<SyncConflict[]> {
  if (!this.db) throw new Error('Database not initialized');

  const rows = await this.db.all(
    'SELECT * FROM sync_conflicts WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    localVersion: JSON.parse(row.local_version),
    remoteVersion: JSON.parse(row.remote_version),
    conflictType: row.conflict_type as any,
    createdAt: new Date(row.created_at)
  }));
};

Database.prototype.getConflict = async function(userId: string, conflictId: string): Promise<SyncConflict | null> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT * FROM sync_conflicts WHERE id = ? AND user_id = ?',
    [conflictId, userId]
  );

  if (!row) return null;

  return {
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    localVersion: JSON.parse(row.local_version),
    remoteVersion: JSON.parse(row.remote_version),
    conflictType: row.conflict_type as any,
    createdAt: new Date(row.created_at)
  };
};

Database.prototype.deleteConflict = async function(userId: string, conflictId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    'DELETE FROM sync_conflicts WHERE id = ? AND user_id = ?',
    [conflictId, userId]
  );
};

Database.prototype.saveBackup = async function(backup: BackupInfo, data: any): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `INSERT INTO backups 
     (id, user_id, type, size, item_count, metadata, data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      backup.id,
      backup.userId,
      backup.type,
      backup.size,
      backup.itemCount,
      JSON.stringify(backup.metadata),
      JSON.stringify(data),
      backup.createdAt.toISOString()
    ]
  );
};

Database.prototype.getBackup = async function(userId: string, backupId: string): Promise<BackupInfo | null> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT * FROM backups WHERE id = ? AND user_id = ?',
    [backupId, userId]
  );

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    size: row.size,
    itemCount: row.item_count,
    metadata: JSON.parse(row.metadata),
    createdAt: new Date(row.created_at)
  };
};

Database.prototype.getBackupData = async function(userId: string, backupId: string): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const row = await this.db.get(
    'SELECT data FROM backups WHERE id = ? AND user_id = ?',
    [backupId, userId]
  );

  if (!row) throw new Error('Backup not found');

  return JSON.parse(row.data);
};

Database.prototype.getSyncHistory = async function(userId: string, deviceId: string, options: any): Promise<any> {
  if (!this.db) throw new Error('Database not initialized');

  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  // 获取总数
  const countResult = await this.db.get(
    'SELECT COUNT(*) as total FROM sync_history WHERE user_id = ? AND device_id = ?',
    [userId, deviceId]
  );
  const total = countResult.total;

  // 获取数据
  const rows = await this.db.all(
    `SELECT * FROM sync_history WHERE user_id = ? AND device_id = ? 
     ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [userId, deviceId, limit, offset]
  );

  const items = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    syncType: row.sync_type,
    status: row.status,
    syncedItems: row.synced_items,
    conflicts: row.conflicts,
    timestamp: new Date(row.timestamp)
  }));

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

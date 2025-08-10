import * as sqlite3 from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite';
import { ContentItem } from '../services/ContentService';
import { AIAnalysisResult, Conversation } from '../services/AIService';
import { SyncChange, SyncConflict, BackupInfo } from '../services/SyncService';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  preferences: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  userId: string;
  type: 'mobile' | 'desktop' | 'browser' | 'glasses';
  platform: string;
  version: string;
  name: string;
  lastSeen: Date;
  isOnline: boolean;
  isTrusted: boolean;
}

export interface Config {
  id: string;
  userId: string;
  deviceId?: string;
  type: 'user' | 'device' | 'app';
  data: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Database {
  private db: SQLiteDatabase | null = null;

  async initialize() {
    this.db = await open({
      filename: 'yourPXO.db',
      driver: sqlite3.Database
    });

    await this.createTables();
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // 用户表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        preferences TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 设备表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        platform TEXT NOT NULL,
        version TEXT NOT NULL,
        name TEXT NOT NULL,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        is_trusted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 配置表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS configs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    // 活动记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    // 内容表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        tags TEXT NOT NULL,
        is_private BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 标注表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        annotation_type TEXT NOT NULL,
        selection TEXT,
        note TEXT,
        tags TEXT,
        color TEXT,
        is_private BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (content_id) REFERENCES contents (id)
      )
    `);

    // AI分析结果表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        results TEXT NOT NULL,
        model TEXT NOT NULL,
        processing_time INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (content_id) REFERENCES contents (id)
      )
    `);

    // 对话表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        messages TEXT NOT NULL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 用户AI记忆表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_ai_memory (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        memory_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 同步更改表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_changes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        type TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    // 同步冲突表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        local_version TEXT NOT NULL,
        remote_version TEXT NOT NULL,
        conflict_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 备份表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        item_count INTEGER NOT NULL,
        metadata TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 同步历史表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        sync_type TEXT NOT NULL,
        status TEXT NOT NULL,
        synced_items INTEGER DEFAULT 0,
        conflicts INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    // 创建索引
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents (user_id);
      CREATE INDEX IF NOT EXISTS idx_contents_type ON contents (type);
      CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents (created_at);
      CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations (user_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_content_id ON annotations (content_id);
      CREATE INDEX IF NOT EXISTS idx_sync_changes_user_id ON sync_changes (user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_changes_timestamp ON sync_changes (timestamp);
    `);
  }

  // 用户相关方法
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date();

    await this.db.run(
      `INSERT INTO users (id, email, password, name, preferences, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.email,
        userData.password,
        userData.name,
        JSON.stringify(userData.preferences),
        now.toISOString(),
        now.toISOString()
      ]
    );

    return {
      id,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      preferences: userData.preferences,
      createdAt: now,
      updatedAt: now
    };
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      preferences: JSON.parse(row.preferences),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      preferences: JSON.parse(row.preferences),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const setFields = [];
    const values = [];

    if (updates.name) {
      setFields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.preferences) {
      setFields.push('preferences = ?');
      values.push(JSON.stringify(updates.preferences));
    }

    setFields.push('updated_at = ?');
    values.push(now.toISOString());
    values.push(id);

    await this.db.run(
      `UPDATE users SET ${setFields.join(', ')} WHERE id = ?`,
      values
    );

    const updatedUser = await this.getUserById(id);
    if (!updatedUser) throw new Error('User not found');

    return updatedUser;
  }

  // 设备相关方法
  async createDevice(deviceData: Omit<Device, 'id'>): Promise<Device> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date();

    await this.db.run(
      `INSERT INTO devices (id, user_id, type, platform, version, name, last_seen, is_online, is_trusted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        deviceData.userId,
        deviceData.type,
        deviceData.platform,
        deviceData.version,
        deviceData.name,
        now.toISOString(),
        deviceData.isOnline,
        deviceData.isTrusted
      ]
    );

    return {
      id,
      userId: deviceData.userId,
      type: deviceData.type,
      platform: deviceData.platform,
      version: deviceData.version,
      name: deviceData.name,
      lastSeen: now,
      isOnline: deviceData.isOnline,
      isTrusted: deviceData.isTrusted
    };
  }

  async getDevicesByUserId(userId: string): Promise<Device[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all('SELECT * FROM devices WHERE user_id = ?', [userId]);
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      platform: row.platform,
      version: row.version,
      name: row.name,
      lastSeen: new Date(row.last_seen),
      isOnline: Boolean(row.is_online),
      isTrusted: Boolean(row.is_trusted)
    }));
  }

  async updateDeviceStatus(id: string, isOnline: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      'UPDATE devices SET is_online = ?, last_seen = ? WHERE id = ?',
      [isOnline, new Date().toISOString(), id]
    );
  }

  // 配置相关方法
  async createConfig(configData: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<Config> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date();

    await this.db.run(
      `INSERT INTO configs (id, user_id, device_id, type, data, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        configData.userId,
        configData.deviceId,
        configData.type,
        JSON.stringify(configData.data),
        configData.version,
        now.toISOString(),
        now.toISOString()
      ]
    );

    return {
      id,
      userId: configData.userId,
      deviceId: configData.deviceId,
      type: configData.type,
      data: configData.data,
      version: configData.version,
      createdAt: now,
      updatedAt: now
    };
  }

  async getConfig(userId: string, type: string, deviceId?: string): Promise<Config | null> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM configs WHERE user_id = ? AND type = ?';
    const params = [userId, type];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    } else {
      query += ' AND device_id IS NULL';
    }

    query += ' ORDER BY version DESC LIMIT 1';

    const row = await this.db.get(query, params);
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      type: row.type,
      data: JSON.parse(row.data),
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async updateConfig(id: string, data: any): Promise<Config> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const config = await this.db.get('SELECT * FROM configs WHERE id = ?', [id]);
    if (!config) throw new Error('Config not found');

    await this.db.run(
      'UPDATE configs SET data = ?, version = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(data), config.version + 1, now.toISOString(), id]
    );

    const updatedConfig = await this.db.get('SELECT * FROM configs WHERE id = ?', [id]);
    return {
      id: updatedConfig.id,
      userId: updatedConfig.user_id,
      deviceId: updatedConfig.device_id,
      type: updatedConfig.type,
      data: JSON.parse(updatedConfig.data),
      version: updatedConfig.version,
      createdAt: new Date(updatedConfig.created_at),
      updatedAt: new Date(updatedConfig.updated_at)
    };
  }

  // 活动记录相关方法
  async createActivity(activityData: {
    userId: string;
    deviceId?: string;
    type: string;
    data: any;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();

    await this.db.run(
      `INSERT INTO activities (id, user_id, device_id, type, data, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        activityData.userId,
        activityData.deviceId,
        activityData.type,
        JSON.stringify(activityData.data),
        new Date().toISOString()
      ]
    );
  }

  async getActivities(userId: string, limit: number = 100): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      type: row.type,
      data: JSON.parse(row.data),
      timestamp: new Date(row.timestamp)
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

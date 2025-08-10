import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';

export interface SyncStatus {
  userId: string;
  deviceId: string;
  lastSyncTime: Date;
  status: 'synced' | 'pending' | 'conflict' | 'error';
  pendingChanges: number;
  conflictCount: number;
}

export interface SyncChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  resourceType: 'content' | 'annotation' | 'preference' | 'memory';
  resourceId: string;
  data?: any;
  timestamp: Date;
  deviceId: string;
  version: number;
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  conflictType: 'concurrent_update' | 'delete_update' | 'type_mismatch';
  createdAt: Date;
}

export interface BackupInfo {
  id: string;
  userId: string;
  type: 'manual' | 'automatic';
  size: number;
  itemCount: number;
  createdAt: Date;
  metadata: any;
}

export class SyncService {
  private database: Database;

  constructor() {
    this.database = new Database();
  }

  // 获取同步状态
  async getSyncStatus(userId: string): Promise<SyncStatus[]> {
    try {
      const devices = await this.database.getUserDevices(userId);
      const syncStatuses: SyncStatus[] = [];

      for (const device of devices) {
        const lastSync = await this.database.getLastSyncTime(userId, device.id);
        const pendingChanges = await this.database.getPendingChangesCount(userId, device.id);
        const conflicts = await this.database.getConflictsCount(userId, device.id);

        syncStatuses.push({
          userId,
          deviceId: device.id,
          lastSyncTime: lastSync || new Date(0),
          status: conflicts > 0 ? 'conflict' : (pendingChanges > 0 ? 'pending' : 'synced'),
          pendingChanges,
          conflictCount: conflicts
        });
      }

      return syncStatuses;
    } catch (error) {
      Logger.error('获取同步状态失败:', error);
      throw new Error('获取同步状态失败');
    }
  }

  // 执行全量同步
  async performFullSync(userId: string, deviceId: string): Promise<{
    success: boolean;
    syncedItems: number;
    conflicts: number;
    timestamp: Date;
  }> {
    try {
      Logger.info(`开始全量同步 - 用户: ${userId}, 设备: ${deviceId}`);
      
      const startTime = Date.now();
      let syncedItems = 0;
      let conflictCount = 0;

      // 1. 获取所有本地数据
      const localContents = await this.database.getAllUserContents(userId);
      const localAnnotations = await this.database.getAllUserAnnotations(userId);
      const localPreferences = await this.database.getUserPreferences(userId);
      const localMemory = await this.database.getUserAIMemory(userId);

      // 2. 获取服务器端数据
      const serverData = await this.getServerData(userId);

      // 3. 比较和合并数据
      const mergeResult = await this.mergeData({
        local: {
          contents: localContents,
          annotations: localAnnotations,
          preferences: localPreferences,
          memory: localMemory
        },
        server: serverData,
        userId,
        deviceId
      });

      syncedItems = mergeResult.syncedItems;
      conflictCount = mergeResult.conflicts.length;

      // 4. 保存冲突
      for (const conflict of mergeResult.conflicts) {
        await this.database.saveConflict(userId, conflict);
      }

      // 5. 更新同步时间戳
      await this.database.updateLastSyncTime(userId, deviceId, new Date());

      const processingTime = Date.now() - startTime;
      Logger.info(`全量同步完成 - 耗时: ${processingTime}ms, 同步项: ${syncedItems}, 冲突: ${conflictCount}`);

      return {
        success: true,
        syncedItems,
        conflicts: conflictCount,
        timestamp: new Date()
      };
    } catch (error) {
      Logger.error('全量同步失败:', error);
      throw new Error('全量同步失败');
    }
  }

  // 执行增量同步
  async performDeltaSync(
    userId: string,
    deviceId: string,
    lastSyncTime: Date,
    changes: SyncChange[]
  ): Promise<{
    success: boolean;
    appliedChanges: number;
    conflicts: number;
    serverChanges: SyncChange[];
  }> {
    try {
      Logger.info(`开始增量同步 - 用户: ${userId}, 设备: ${deviceId}`);

      let appliedChanges = 0;
      let conflictCount = 0;
      const serverChanges: SyncChange[] = [];

      // 1. 获取服务器端的更改
      const remoteChanges = await this.database.getChangesAfter(userId, lastSyncTime);

      // 2. 应用客户端更改到服务器
      for (const change of changes) {
        try {
          const conflict = await this.applyChangeToServer(userId, change, remoteChanges);
          if (conflict) {
            conflictCount++;
            await this.database.saveConflict(userId, conflict);
          } else {
            appliedChanges++;
          }
        } catch (error) {
          Logger.error(`应用更改失败 - 更改ID: ${change.id}`, error);
        }
      }

      // 3. 返回服务器端更改给客户端
      for (const remoteChange of remoteChanges) {
        if (!this.isChangeFromDevice(remoteChange, deviceId)) {
          serverChanges.push(remoteChange);
        }
      }

      // 4. 更新同步时间戳
      await this.database.updateLastSyncTime(userId, deviceId, new Date());

      Logger.info(`增量同步完成 - 应用更改: ${appliedChanges}, 冲突: ${conflictCount}, 服务器更改: ${serverChanges.length}`);

      return {
        success: true,
        appliedChanges,
        conflicts: conflictCount,
        serverChanges
      };
    } catch (error) {
      Logger.error('增量同步失败:', error);
      throw new Error('增量同步失败');
    }
  }

  // 获取冲突列表
  async getConflicts(userId: string): Promise<SyncConflict[]> {
    try {
      return await this.database.getUserConflicts(userId);
    } catch (error) {
      Logger.error('获取冲突列表失败:', error);
      throw new Error('获取冲突失败');
    }
  }

  // 解决冲突
  async resolveConflict(
    userId: string,
    conflictId: string,
    resolution: 'use_local' | 'use_remote' | 'merge' | 'custom',
    customData?: any
  ): Promise<{ success: boolean }> {
    try {
      const conflict = await this.database.getConflict(userId, conflictId);
      if (!conflict) {
        throw new Error('冲突不存在');
      }

      let resolvedData: any;

      switch (resolution) {
        case 'use_local':
          resolvedData = conflict.localVersion;
          break;
        case 'use_remote':
          resolvedData = conflict.remoteVersion;
          break;
        case 'merge':
          resolvedData = this.mergeConflictData(conflict.localVersion, conflict.remoteVersion);
          break;
        case 'custom':
          resolvedData = customData;
          break;
        default:
          throw new Error('无效的解决方案');
      }

      // 应用解决方案
      await this.applyConflictResolution(conflict, resolvedData);

      // 删除冲突记录
      await this.database.deleteConflict(userId, conflictId);

      Logger.info(`冲突解决 - 用户: ${userId}, 冲突: ${conflictId}, 方案: ${resolution}`);
      return { success: true };
    } catch (error) {
      Logger.error('解决冲突失败:', error);
      throw new Error('冲突解决失败');
    }
  }

  // 创建备份
  async createBackup(userId: string): Promise<BackupInfo> {
    try {
      const backupId = uuidv4();
      
      // 收集所有用户数据
      const userData = await this.collectUserData(userId);
      
      const backup: BackupInfo = {
        id: backupId,
        userId,
        type: 'manual',
        size: JSON.stringify(userData).length,
        itemCount: this.countBackupItems(userData),
        createdAt: new Date(),
        metadata: {
          version: '1.0',
          dataTypes: Object.keys(userData)
        }
      };

      // 保存备份
      await this.database.saveBackup(backup, userData);

      Logger.info(`创建备份 - 用户: ${userId}, 备份: ${backupId}, 大小: ${backup.size} bytes`);
      return backup;
    } catch (error) {
      Logger.error('创建备份失败:', error);
      throw new Error('备份创建失败');
    }
  }

  // 从备份恢复
  async restoreFromBackup(userId: string, backupId: string): Promise<{
    success: boolean;
    restoredItems: number;
  }> {
    try {
      const backup = await this.database.getBackup(userId, backupId);
      if (!backup) {
        throw new Error('备份不存在');
      }

      const backupData = await this.database.getBackupData(userId, backupId);
      
      // 恢复数据
      let restoredItems = 0;
      
      if (backupData.contents) {
        for (const content of backupData.contents) {
          await this.database.saveContent(content);
          restoredItems++;
        }
      }

      if (backupData.annotations) {
        for (const annotation of backupData.annotations) {
          await this.database.saveAnnotation(annotation);
          restoredItems++;
        }
      }

      if (backupData.preferences) {
        await this.database.updateUserPreferences(userId, backupData.preferences);
        restoredItems++;
      }

      if (backupData.memory) {
        await this.database.updateUserAIMemory(userId, backupData.memory);
        restoredItems++;
      }

      Logger.info(`从备份恢复 - 用户: ${userId}, 备份: ${backupId}, 恢复项: ${restoredItems}`);
      return {
        success: true,
        restoredItems
      };
    } catch (error) {
      Logger.error('从备份恢复失败:', error);
      throw new Error('备份恢复失败');
    }
  }

  // 获取同步历史
  async getSyncHistory(
    userId: string,
    deviceId: string,
    options: { page: number; limit: number }
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      return await this.database.getSyncHistory(userId, deviceId, options);
    } catch (error) {
      Logger.error('获取同步历史失败:', error);
      throw new Error('获取同步历史失败');
    }
  }

  // 私有方法
  private async getServerData(userId: string): Promise<any> {
    // 获取服务器端的所有用户数据
    return {
      contents: await this.database.getAllUserContents(userId),
      annotations: await this.database.getAllUserAnnotations(userId),
      preferences: await this.database.getUserPreferences(userId),
      memory: await this.database.getUserAIMemory(userId)
    };
  }

  private async mergeData(params: {
    local: any;
    server: any;
    userId: string;
    deviceId: string;
  }): Promise<{ syncedItems: number; conflicts: SyncConflict[] }> {
    // 实现数据合并逻辑
    let syncedItems = 0;
    const conflicts: SyncConflict[] = [];

    // TODO: 实现具体的合并逻辑

    return { syncedItems, conflicts };
  }

  private async applyChangeToServer(
    userId: string,
    change: SyncChange,
    remoteChanges: SyncChange[]
  ): Promise<SyncConflict | null> {
    // 检查是否有冲突
    const conflictingChange = remoteChanges.find(
      rc => rc.resourceType === change.resourceType && 
           rc.resourceId === change.resourceId &&
           rc.timestamp > change.timestamp
    );

    if (conflictingChange) {
      // 创建冲突记录
      return {
        id: uuidv4(),
        resourceType: change.resourceType,
        resourceId: change.resourceId,
        localVersion: change.data,
        remoteVersion: conflictingChange.data,
        conflictType: 'concurrent_update',
        createdAt: new Date()
      };
    }

    // 应用更改
    await this.applyChange(userId, change);
    return null;
  }

  private async applyChange(userId: string, change: SyncChange): Promise<void> {
    switch (change.resourceType) {
      case 'content':
        if (change.type === 'create' || change.type === 'update') {
          await this.database.saveContent(change.data);
        } else if (change.type === 'delete') {
          await this.database.deleteContent(userId, change.resourceId);
        }
        break;
      case 'annotation':
        if (change.type === 'create' || change.type === 'update') {
          await this.database.saveAnnotation(change.data);
        } else if (change.type === 'delete') {
          await this.database.deleteAnnotation(userId, change.resourceId);
        }
        break;
      // 其他资源类型...
    }
  }

  private isChangeFromDevice(change: SyncChange, deviceId: string): boolean {
    return change.deviceId === deviceId;
  }

  private mergeConflictData(local: any, remote: any): any {
    // 实现智能合并逻辑
    return { ...remote, ...local };
  }

  private async applyConflictResolution(conflict: SyncConflict, resolvedData: any): Promise<void> {
    // 应用冲突解决方案
    const change: SyncChange = {
      id: uuidv4(),
      type: 'update',
      resourceType: conflict.resourceType as any,
      resourceId: conflict.resourceId,
      data: resolvedData,
      timestamp: new Date(),
      deviceId: 'system',
      version: 1
    };

    await this.applyChange('', change);
  }

  private async collectUserData(userId: string): Promise<any> {
    return {
      contents: await this.database.getAllUserContents(userId),
      annotations: await this.database.getAllUserAnnotations(userId),
      preferences: await this.database.getUserPreferences(userId),
      memory: await this.database.getUserAIMemory(userId),
      conversations: await this.database.getUserConversations(userId)
    };
  }

  private countBackupItems(userData: any): number {
    let count = 0;
    if (userData.contents) count += userData.contents.length;
    if (userData.annotations) count += userData.annotations.length;
    if (userData.preferences) count += 1;
    if (userData.memory) count += 1;
    if (userData.conversations) count += userData.conversations.length;
    return count;
  }
}

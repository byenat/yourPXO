import { Request, Response } from 'express';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';

export class ConfigService {
  private database: Database;
  private logger: Logger;

  constructor(database: Database) {
    this.database = database;
    this.logger = new Logger();
  }

  async getUserConfig(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // 这里应该验证token并获取userId
      // 为了演示，我们假设从请求参数获取userId
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const config = await this.database.getConfig(userId as string, 'user');

      if (!config) {
        return res.status(404).json({ error: 'User config not found' });
      }

      res.json({
        success: true,
        config: {
          id: config.id,
          type: config.type,
          data: config.data,
          version: config.version,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to get user config', error);
      res.status(500).json({ error: 'Failed to get user config' });
    }
  }

  async updateUserConfig(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // 这里应该验证token并获取userId
      const { userId } = req.body;
      const { data } = req.body;

      if (!userId || !data) {
        return res.status(400).json({ error: 'userId and data are required' });
      }

      // 获取现有配置或创建新配置
      let config = await this.database.getConfig(userId, 'user');

      if (config) {
        // 更新现有配置
        config = await this.database.updateConfig(config.id, data);
      } else {
        // 创建新配置
        config = await this.database.createConfig({
          userId,
          type: 'user',
          data,
          version: 1
        });
      }

      this.logger.info('User config updated', { userId, configId: config.id });

      res.json({
        success: true,
        config: {
          id: config.id,
          type: config.type,
          data: config.data,
          version: config.version,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to update user config', error);
      res.status(500).json({ error: 'Failed to update user config' });
    }
  }

  async getDeviceConfig(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const { deviceId } = req.params;
      const { userId } = req.query;

      if (!userId || !deviceId) {
        return res.status(400).json({ error: 'userId and deviceId are required' });
      }

      const config = await this.database.getConfig(userId as string, 'device', deviceId);

      if (!config) {
        return res.status(404).json({ error: 'Device config not found' });
      }

      res.json({
        success: true,
        config: {
          id: config.id,
          type: config.type,
          deviceId: config.deviceId,
          data: config.data,
          version: config.version,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to get device config', error);
      res.status(500).json({ error: 'Failed to get device config' });
    }
  }

  async updateDeviceConfig(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const { deviceId } = req.params;
      const { userId, data } = req.body;

      if (!userId || !deviceId || !data) {
        return res.status(400).json({ error: 'userId, deviceId, and data are required' });
      }

      // 获取现有配置或创建新配置
      let config = await this.database.getConfig(userId, 'device', deviceId);

      if (config) {
        // 更新现有配置
        config = await this.database.updateConfig(config.id, data);
      } else {
        // 创建新配置
        config = await this.database.createConfig({
          userId,
          deviceId,
          type: 'device',
          data,
          version: 1
        });
      }

      this.logger.info('Device config updated', { 
        userId, 
        deviceId, 
        configId: config.id 
      });

      res.json({
        success: true,
        config: {
          id: config.id,
          type: config.type,
          deviceId: config.deviceId,
          data: config.data,
          version: config.version,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to update device config', error);
      res.status(500).json({ error: 'Failed to update device config' });
    }
  }
}

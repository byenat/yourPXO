import { Request, Response } from 'express';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';

export class DeviceService {
  private database: Database;
  private logger: Logger;

  constructor(database: Database) {
    this.database = database;
    this.logger = new Logger();
  }

  async register(req: Request, res: Response) {
    try {
      const { userId, type, platform, version, name } = req.body;

      if (!userId || !type || !platform || !version || !name) {
        return res.status(400).json({ 
          error: 'userId, type, platform, version, and name are required' 
        });
      }

      const device = await this.database.createDevice({
        userId,
        type,
        platform,
        version,
        name,
        lastSeen: new Date(),
        isOnline: true,
        isTrusted: false
      });

      this.logger.info('Device registered successfully', { 
        deviceId: device.id, 
        userId, 
        type 
      });

      res.status(201).json({
        success: true,
        device: {
          id: device.id,
          type: device.type,
          platform: device.platform,
          version: device.version,
          name: device.name,
          isOnline: device.isOnline,
          isTrusted: device.isTrusted,
          lastSeen: device.lastSeen
        }
      });
    } catch (error) {
      this.logger.error('Failed to register device', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { deviceId, isOnline } = req.body;

      if (!deviceId || typeof isOnline !== 'boolean') {
        return res.status(400).json({ 
          error: 'deviceId and isOnline are required' 
        });
      }

      await this.database.updateDeviceStatus(deviceId, isOnline);

      this.logger.info('Device status updated', { deviceId, isOnline });

      res.json({
        success: true,
        message: 'Device status updated successfully'
      });
    } catch (error) {
      this.logger.error('Failed to update device status', error);
      res.status(500).json({ error: 'Failed to update device status' });
    }
  }

  async getDevices(req: Request, res: Response) {
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

      const devices = await this.database.getDevicesByUserId(userId as string);

      res.json({
        success: true,
        devices: devices.map(device => ({
          id: device.id,
          type: device.type,
          platform: device.platform,
          version: device.version,
          name: device.name,
          isOnline: device.isOnline,
          isTrusted: device.isTrusted,
          lastSeen: device.lastSeen
        }))
      });
    } catch (error) {
      this.logger.error('Failed to get devices', error);
      res.status(500).json({ error: 'Failed to get devices' });
    }
  }
}

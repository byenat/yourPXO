import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';
import '../database/DatabaseExtensions'; // 导入扩展方法

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  preferences?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: 'mobile' | 'desktop' | 'browser' | 'glasses';
    version?: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    preferences: any;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserService {
  private database: Database;
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor(database: Database) {
    this.database = database;
  }

  async register(req: Request, res: Response): Promise<AuthResponse> {
    try {
      const { email, password, name, avatar, preferences }: RegisterRequest = req.body;

      // 检查用户是否已存在
      const existingUser = await this.database.getUserByEmail(email);
      if (existingUser) {
        throw new Error('用户已存在');
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);

      // 默认偏好设置
      const defaultPreferences = {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        theme: 'auto',
        notifications: {
          email: true,
          push: true,
          digest: true
        },
        privacy: {
          dataSharing: false,
          analytics: true,
          publicProfile: false
        },
        ai: {
          enablePersonalization: true,
          preferredModel: 'auto',
          creativityLevel: 0.7
        },
        ...preferences
      };

      // 创建用户
      const user = await this.database.createUser({
        email,
        password: hashedPassword,
        name,
        preferences: defaultPreferences
      });

      // 生成token
      const { accessToken, refreshToken, expiresIn } = this.generateTokens(user.id);

      // 记录设备信息（如果提供）
      if (req.body.deviceInfo) {
        await this.database.createDevice({
          userId: user.id,
          type: req.body.deviceInfo.platform,
          platform: req.body.deviceInfo.platform,
          version: req.body.deviceInfo.version || '1.0.0',
          name: req.body.deviceInfo.deviceName,
          lastSeen: new Date(),
          isOnline: true,
          isTrusted: true
        });
      }

      Logger.info(`用户注册成功: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar,
          preferences: user.preferences
        },
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error: any) {
      Logger.error('用户注册失败:', error);
      throw new Error(error.message || '注册失败');
    }
  }

  async login(req: Request, res: Response): Promise<AuthResponse> {
    try {
      const { email, password, deviceInfo }: LoginRequest = req.body;

      // 验证用户
      const user = await this.database.getUserByEmail(email);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 生成token
      const { accessToken, refreshToken, expiresIn } = this.generateTokens(user.id);

      // 更新或创建设备信息
      if (deviceInfo) {
        const existingDevice = await this.database.getDevicesByUserId(user.id);
        const device = existingDevice.find(d => d.name === deviceInfo.deviceName);

        if (device) {
          await this.database.updateDeviceStatus(device.id, true);
        } else {
          await this.database.createDevice({
            userId: user.id,
            type: deviceInfo.platform,
            platform: deviceInfo.platform,
            version: deviceInfo.version || '1.0.0',
            name: deviceInfo.deviceName,
            lastSeen: new Date(),
            isOnline: true,
            isTrusted: true
          });
        }
      }

      Logger.info(`用户登录成功: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences
        },
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error: any) {
      Logger.error('用户登录失败:', error);
      throw new Error(error.message || '登录失败');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        throw new Error('Refresh token无效或已过期');
      }

      // 生成新的访问token
      const { accessToken, expiresIn } = this.generateAccessToken(tokenData.userId);

      Logger.info(`Token刷新成功: 用户 ${tokenData.userId}`);

      return { accessToken, expiresIn };
    } catch (error: any) {
      Logger.error('Token刷新失败:', error);
      throw new Error(error.message || 'Token刷新失败');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      this.refreshTokens.delete(refreshToken);
      Logger.info('用户登出成功');
    } catch (error: any) {
      Logger.error('用户登出失败:', error);
      throw new Error('登出失败');
    }
  }

  async getProfile(userId: string): Promise<any> {
    try {
      const user = await this.database.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error: any) {
      Logger.error('获取用户资料失败:', error);
      throw new Error('获取用户资料失败');
    }
  }

  async updateProfile(userId: string, updates: {
    name?: string;
    avatar?: string;
    bio?: string;
    preferences?: any;
  }): Promise<any> {
    try {
      const user = await this.database.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.preferences) {
        updateData.preferences = {
          ...user.preferences,
          ...updates.preferences
        };
      }

      const updatedUser = await this.database.updateUser(userId, updateData);

      Logger.info(`用户资料更新成功: ${userId}`);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        preferences: updatedUser.preferences,
        updatedAt: updatedUser.updatedAt
      };
    } catch (error: any) {
      Logger.error('更新用户资料失败:', error);
      throw new Error('更新用户资料失败');
    }
  }

  async getUserStats(userId: string): Promise<any> {
    try {
      // 获取用户统计信息
      const user = await this.database.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const contents = await this.database.getAllUserContents(userId);
      const annotations = await this.database.getAllUserAnnotations(userId);
      const devices = await this.database.getUserDevices(userId);
      const conversations = await this.database.getUserConversations(userId);

      const stats = {
        totalContents: contents.length,
        contentsByType: this.groupByType(contents),
        totalAnnotations: annotations.length,
        totalDevices: devices.length,
        totalConversations: conversations.length,
        joinedDate: user.createdAt,
        lastActivity: Math.max(
          ...contents.map(c => c.updatedAt.getTime()),
          ...annotations.map(a => a.updatedAt.getTime())
        )
      };

      return stats;
    } catch (error: any) {
      Logger.error('获取用户统计失败:', error);
      throw new Error('获取用户统计失败');
    }
  }

  async getUserDevices(userId: string): Promise<any[]> {
    try {
      const devices = await this.database.getUserDevices(userId);
      return devices.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        platform: device.platform,
        version: device.version,
        lastSeen: device.lastSeen,
        isOnline: device.isOnline,
        isTrusted: device.isTrusted
      }));
    } catch (error: any) {
      Logger.error('获取用户设备失败:', error);
      throw new Error('获取用户设备失败');
    }
  }

  // 私有方法
  private generateTokens(userId: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }

    const expiresIn = 3600; // 1小时
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      jwtSecret,
      { expiresIn }
    );

    const refreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30天

    this.refreshTokens.set(refreshToken, {
      userId,
      expiresAt: refreshExpiresAt
    });

    return { accessToken, refreshToken, expiresIn };
  }

  private generateAccessToken(userId: string): {
    accessToken: string;
    expiresIn: number;
  } {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }

    const expiresIn = 3600; // 1小时
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      jwtSecret,
      { expiresIn }
    );

    return { accessToken, expiresIn };
  }

  private groupByType(items: any[]): { [key: string]: number } {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  }
}
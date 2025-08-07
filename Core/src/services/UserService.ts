import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';

export class UserService {
  private database: Database;
  private logger: Logger;

  constructor(database: Database) {
    this.database = database;
    this.logger = new Logger();
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'email, password, and name are required' });
      }

      // 检查用户是否已存在
      const existingUser = await this.database.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await this.database.createUser({
        email,
        password: hashedPassword,
        name,
        preferences: {
          theme: 'auto',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          notifications: {
            email: true,
            push: true,
            sms: false,
            focusMode: true,
            reminders: true
          },
          privacy: {
            dataSharing: false,
            analytics: true,
            personalizedAds: false,
            locationSharing: false
          },
          focus: {
            autoEnable: false,
            duration: 25,
            breakDuration: 5,
            notifications: true,
            websites: []
          }
        }
      });

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      this.logger.info('User registered successfully', { userId: user.id, email });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences
        },
        token
      });
    } catch (error) {
      this.logger.error('Failed to register user', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
      }

      // 查找用户
      const user = await this.database.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      this.logger.info('User logged in successfully', { userId: user.id, email });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences
        },
        token
      });
    } catch (error) {
      this.logger.error('Failed to login user', error);
      res.status(500).json({ error: 'Failed to login user' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await this.database.getUserById(decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to get user profile', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const { name, preferences } = req.body;

      const updatedUser = await this.database.updateUser(decoded.userId, {
        name,
        preferences
      });

      this.logger.info('User profile updated', { userId: decoded.userId });

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          preferences: updatedUser.preferences,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to update user profile', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }
}

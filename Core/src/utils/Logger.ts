import * as winston from 'winston';

class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'yourPXO-core' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
      ]
    });

    // 在开发环境下同时输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: any) {
    this.logger.error(message, { error: error?.message || error, stack: error?.stack });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
}

// 创建单例实例
const loggerInstance = new LoggerService();

// 导出静态方法
export const Logger = {
  info: (message: string, meta?: any) => loggerInstance.info(message, meta),
  error: (message: string, error?: any) => loggerInstance.error(message, error),
  warn: (message: string, meta?: any) => loggerInstance.warn(message, meta),
  debug: (message: string, meta?: any) => loggerInstance.debug(message, meta)
};
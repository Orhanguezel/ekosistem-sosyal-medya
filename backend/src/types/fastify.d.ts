import type { MySQLPromisePool } from '@fastify/mysql';

declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLPromisePool;
    db: MySQLPromisePool;
  }

  interface FastifyContextConfig {
    auth?: boolean;
    rateLimit?: {
      max?: number;
      timeWindow?: string;
    };
  }
}

// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';
import { startCronJobs } from './cron/index';

async function main() {
  const app: any = await createApp();

  const host = (process.env.HOST ?? '127.0.0.1') as string;

  await app.listen({ port: env.PORT, host });

  console.log(`API listening ${host}:${env.PORT}`);

  // Cron gorevlerini baslat
  startCronJobs();
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});

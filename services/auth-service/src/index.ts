import { createApp } from './app';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './lib/mongoose';
import { disconnectRedis } from './lib/redis';

async function bootstrap(): Promise<void> {
  await connectMongo();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(
      JSON.stringify({
        level: 'info',
        service: 'auth-service',
        msg: `Auth service listening on port ${env.port}`,
        nodeEnv: env.nodeEnv,
      })
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(JSON.stringify({ level: 'info', service: 'auth-service', msg: `${signal} received, shutting down` }));
    server.close();
    await Promise.allSettled([disconnectMongo(), disconnectRedis()]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'auth-service',
      msg: 'Fatal bootstrap error',
      message: err instanceof Error ? err.message : String(err),
    })
  );
  process.exit(1);
});

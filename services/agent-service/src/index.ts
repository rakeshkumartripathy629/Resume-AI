import { createApp } from './app';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './lib/mongoose';

async function bootstrap(): Promise<void> {
  await connectMongo();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(
      JSON.stringify({
        level: 'info',
        service: 'agent-service',
        msg: `Agent service listening on port ${env.port}`,
        nodeEnv: env.nodeEnv,
        llmConfigured: Boolean(env.openai.apiKey),
      })
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(JSON.stringify({ level: 'info', service: 'agent-service', msg: `${signal} received, shutting down` }));
    server.close();
    await Promise.allSettled([disconnectMongo()]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'agent-service',
      msg: 'Fatal bootstrap error',
      message: err instanceof Error ? err.message : String(err),
    })
  );
  process.exit(1);
});

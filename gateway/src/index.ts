import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(
    JSON.stringify({
      level: 'info',
      service: 'gateway',
      msg: `Gateway listening on port ${env.port}`,
      nodeEnv: env.nodeEnv,
    })
  );
});

// ── Graceful Shutdown ───────────────────────────────────────────────────────

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(
    JSON.stringify({
      level: 'info',
      service: 'gateway',
      msg: `${signal} received — shutting down gracefully`,
    })
  );

  // Stop accepting new connections
  server.close(() => {
    console.log(
      JSON.stringify({
        level: 'info',
        service: 'gateway',
        msg: 'Server closed',
      })
    );
    process.exit(0);
  });

  // Force kill after 10s
  setTimeout(() => {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'gateway',
        msg: 'Forced shutdown after timeout',
      })
    );
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

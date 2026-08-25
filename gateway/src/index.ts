import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(
    JSON.stringify({
      level: 'info',
      service: 'gateway',
      msg: `Gateway listening on port ${env.port}`,
      nodeEnv: env.nodeEnv,
    })
  );
});

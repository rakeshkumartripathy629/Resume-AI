/**
 * Production start script — sequential startup to stay under 512MB RAM.
 * Uses tsx to run TypeScript directly (no build step).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const services = [
  { name: 'auth',       dir: 'services/auth-service',       port: 4001 },
  { name: 'agent',      dir: 'services/agent-service',      port: 4002 },
  { name: 'interview',  dir: 'services/interview-service',  port: 4003 },
  { name: 'roadmap',    dir: 'services/roadmap-service',    port: 4004 },
  { name: 'billing',    dir: 'services/billing-service',    port: 4005 },
  { name: 'gateway',    dir: 'gateway',                     port: parseInt(process.env.PORT || '10000', 10) },
];

const children = [];

function startService(svc, delayMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cwd = path.join(ROOT, svc.dir);
      const entry = path.join(cwd, 'src', 'index.ts');

      if (!fs.existsSync(entry)) {
        console.error(`  ❌ ${svc.name}: ${entry} not found`);
        resolve();
        return;
      }

      const tsxLocal = path.join(cwd, 'node_modules', '.bin', 'tsx');
      const tsxCmd = fs.existsSync(tsxLocal) ? tsxLocal : 'npx';
      const tsxArgs = fs.existsSync(tsxLocal) ? [] : ['tsx'];

      const env = {
        ...process.env,
        PORT: String(svc.port),
        NODE_ENV: 'production',
      };

      const child = spawn(tsxCmd, [...tsxArgs, entry], {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const prefix = `[${svc.name}]`.padEnd(12);

      child.stdout?.on('data', (data) => {
        for (const line of data.toString().trim().split('\n')) {
          console.log(`${prefix} ${line}`);
        }
      });

      child.stderr?.on('data', (data) => {
        for (const line of data.toString().trim().split('\n')) {
          console.log(`${prefix} ${line}`);
        }
      });

      child.on('exit', (code) => {
        console.log(`${prefix} Exited (code=${code})`);
        if (code !== 0) {
          console.log(`${prefix} Restarting in 5s...`);
          setTimeout(() => startService(svc, 0), 5000);
        }
      });

      children.push(child);
      console.log(`  ✅ ${svc.name} started on port ${svc.port}`);
      resolve();
    }, delayMs);
  });
}

async function main() {
  console.log('\n🚀 Starting services sequentially (512MB RAM safe)...\n');

  for (let i = 0; i < services.length; i++) {
    await startService(services[i], i === 0 ? 0 : 3000);
  }

  console.log('\n✅ All services running!\n');
}

main();

function shutdown(signal) {
  console.log(`\n🛑 ${signal} received, shutting down...`);
  for (const child of children) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

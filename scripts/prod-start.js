/**
 * Production start script for Railway
 * Builds all TypeScript services, then starts all 6 backend services concurrently.
 * Gateway is the only externally exposed port (Railway sets PORT).
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const services = [
  { name: 'gateway',    dir: 'gateway',                     script: 'dist/index.js',    port: 4000 },
  { name: 'auth',       dir: 'services/auth-service',       script: 'dist/index.js',    port: 4001 },
  { name: 'agent',      dir: 'services/agent-service',      script: 'dist/index.js',    port: 4002 },
  { name: 'interview',  dir: 'services/interview-service',  script: 'dist/index.js',    port: 4003 },
  { name: 'roadmap',    dir: 'services/roadmap-service',    script: 'dist/index.js',    port: 4004 },
  { name: 'billing',    dir: 'services/billing-service',    script: 'dist/index.js',    port: 4005 },
];

// Railway provides PORT for the externally exposed port (gateway)
const RAILWAY_PORT = process.env.PORT || 4000;

// ── Step 1: Build all services ───────────────────────────────────────

console.log('\n🔨 Building all services...\n');

for (const svc of services) {
  const svcPath = path.join(ROOT, svc.dir);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(svcPath, 'package.json'), 'utf8'));

  if (pkgJson.scripts?.build) {
    console.log(`  ⏳ Building ${svc.name}...`);
    try {
      execSync('npm run build', { cwd: svcPath, stdio: 'pipe', timeout: 120000 });
      console.log(`  ✅ ${svc.name} built`);
    } catch (err) {
      console.error(`  ❌ ${svc.name} build failed:`, err.stderr?.toString() || err.message);
      process.exit(1);
    }
  } else {
    console.log(`  ⏭️  ${svc.name} — no build script, skipping`);
  }
}

console.log('\n🚀 Starting all services...\n');

// ── Step 2: Start all services concurrently ──────────────────────────

const children = [];

function startService(svc) {
  const cwd = path.join(ROOT, svc.dir);
  const entry = path.join(cwd, svc.script);

  if (!fs.existsSync(entry)) {
    console.error(`  ❌ ${svc.name}: ${svc.script} not found at ${entry}`);
    return;
  }

  const env = {
    ...process.env,
    PORT: svc.name === 'gateway' ? RAILWAY_PORT : String(svc.port),
    NODE_ENV: 'production',
  };

  const child = spawn('node', [entry], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = `[${svc.name}]`.padEnd(12);

  child.stdout?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.log(`${prefix} ${line}`);
    }
  });

  child.stderr?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.log(`${prefix} ${line}`);
    }
  });

  child.on('exit', (code, signal) => {
    console.log(`${prefix} Exited (code=${code}, signal=${signal})`);
    // If a critical service dies, restart it
    if (code !== 0 && svc.name !== 'gateway') {
      console.log(`${prefix} Restarting in 3s...`);
      setTimeout(() => startService(svc), 3000);
    }
  });

  children.push(child);
  console.log(`  ✅ ${svc.name} started on port ${svc.name === 'gateway' ? RAILWAY_PORT : svc.port}`);
}

for (const svc of services) {
  startService(svc);
}

// ── Graceful shutdown ────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n🛑 ${signal} received, shutting down...`);
  for (const child of children) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log('\n✅ All services running! Gateway on port ' + RAILWAY_PORT + '\n');

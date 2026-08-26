/**
 * Production start script
 * Runs all 6 backend services. Uses tsx for TS (skips build — saves memory).
 * Gateway is the only externally exposed port (PORT env var from host).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const services = [
  { name: 'gateway',    dir: 'gateway',                     port: 4000 },
  { name: 'auth',       dir: 'services/auth-service',       port: 4001 },
  { name: 'agent',      dir: 'services/agent-service',      port: 4002 },
  { name: 'interview',  dir: 'services/interview-service',  port: 4003 },
  { name: 'roadmap',    dir: 'services/roadmap-service',    port: 4004 },
  { name: 'billing',    dir: 'services/billing-service',    port: 4005 },
];

const HOST_PORT = process.env.PORT || 4000;

// ── Install dependencies for all services ───────────────────────────

console.log('\n📦 Installing dependencies...\n');

const { execSync } = require('child_process');

for (const svc of services) {
  const svcPath = path.join(ROOT, svc.dir);
  if (!fs.existsSync(path.join(svcPath, 'node_modules'))) {
    console.log(`  ⏳ Installing ${svc.name}...`);
    try {
      execSync('npm install --omit=dev', { cwd: svcPath, stdio: 'pipe', timeout: 120000 });
      console.log(`  ✅ ${svc.name} installed`);
    } catch {
      console.log(`  ⚠️  ${svc.name} install failed, trying full install...`);
      try {
        execSync('npm install', { cwd: svcPath, stdio: 'pipe', timeout: 120000 });
        console.log(`  ✅ ${svc.name} installed (full)`);
      } catch (err2) {
        console.error(`  ❌ ${svc.name} install failed:`, err2.message);
      }
    }
  } else {
    console.log(`  ⏭️  ${svc.name} — already installed`);
  }
}

// ── Step 2: Start all services with tsx (no build needed) ───────────

console.log('\n🚀 Starting all services...\n');

const children = [];

function startService(svc) {
  const cwd = path.join(ROOT, svc.dir);
  const entry = path.join(cwd, 'src', 'index.ts');

  if (!fs.existsSync(entry)) {
    console.error(`  ❌ ${svc.name}: ${entry} not found`);
    return;
  }

  // Find tsx binary — prefer local, fallback to npx
  const tsxLocal = path.join(cwd, 'node_modules', '.bin', 'tsx');
  const tsxCmd = fs.existsSync(tsxLocal) ? tsxLocal : 'npx';
  const tsxArgs = fs.existsSync(tsxLocal) ? [] : ['tsx'];

  const env = {
    ...process.env,
    PORT: svc.name === 'gateway' ? String(HOST_PORT) : String(svc.port),
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
    if (code !== 0 && svc.name !== 'gateway') {
      console.log(`${prefix} Restarting in 5s...`);
      setTimeout(() => startService(svc), 5000);
    }
  });

  children.push(child);
  console.log(`  ✅ ${svc.name} started on port ${svc.name === 'gateway' ? HOST_PORT : svc.port}`);
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

console.log('\n✅ All services running! Gateway on port ' + HOST_PORT + '\n');

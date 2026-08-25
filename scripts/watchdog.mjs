import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Service Registry ────────────────────────────────────────────────────────

const SERVICES = [
  { name: 'gateway',   port: 4000, dir: 'gateway',                         url: 'http://localhost:4000/health' },
  { name: 'auth',      port: 4001, dir: 'services/auth-service',            url: 'http://localhost:4001/health' },
  { name: 'agent',     port: 4002, dir: 'services/agent-service',           url: 'http://localhost:4002/health' },
  { name: 'interview', port: 4003, dir: 'services/interview-service',       url: 'http://localhost:4003/health' },
  { name: 'roadmap',   port: 4004, dir: 'services/roadmap-service',         url: 'http://localhost:4004/health' },
  { name: 'billing',   port: 4005, dir: 'services/billing-service',         url: 'http://localhost:4005/health' },
  { name: 'client',    port: 5173, dir: 'client',                           url: 'http://localhost:5173/' },
];

const MAX_RESTARTS = 3;
const CHECK_INTERVAL_MS = 10_000;
const RESTART_COOLDOWN_MS = 15_000;
const HEALTH_TIMEOUT_MS = 3_000;

// ── State ───────────────────────────────────────────────────────────────────

const state = {};
for (const svc of SERVICES) {
  state[svc.name] = {
    restarts: 0,
    lastRestart: 0,
    downSince: null,
    process: null,
    consecutiveFails: 0,
  };
}

// ── Colors ──────────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function ts() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

// ── HTTP Health Check ───────────────────────────────────────────────────────

function checkHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: HEALTH_TIMEOUT_MS }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ ok: res.statusCode === 200, status: res.statusCode });
      });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
  });
}

// ── Restart Service ─────────────────────────────────────────────────────────

function restartService(svc) {
  const s = state[svc.name];
  const now = Date.now();

  // Cooldown check
  if (now - s.lastRestart < RESTART_COOLDOWN_MS) return;

  // Max restarts check
  if (s.restarts >= MAX_RESTARTS) {
    console.log(`${C.red}${C.bold}[GIVEUP] ${svc.name}${C.reset} — max restarts (${MAX_RESTARTS}) reached. Manual intervention needed.`);
    return;
  }

  s.restarts++;
  s.lastRestart = now;

  console.log(`${C.yellow}${C.bold}[RESTART #${s.restarts}] ${svc.name}${C.reset} ${C.dim}(port ${svc.port})${C.reset}`);

  // Kill existing process on that port if any
  try {
    const output = execSync(`netstat -ano | findstr ":${svc.port}" | findstr "LISTENING"`, { encoding: 'utf-8', stdio: 'pipe' });
    const lines = output.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1]);
      if (pid && pid > 0 && !isNaN(pid)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
          console.log(`${C.dim}  killed PID ${pid} on port ${svc.port}${C.reset}`);
        } catch {}
      }
    }
  } catch {}

  // Wait a beat then start
  setTimeout(() => {
    const isClient = svc.name === 'client';
    const cmd = isClient ? 'npx vite --port 5173' : 'npm run dev';
    const child = spawn(cmd, [], {
      cwd: path.join(ROOT, svc.dir),
      shell: true,
      stdio: 'ignore',
      detached: true,
    });

    child.unref();
    s.process = child;

    child.on('error', (err) => {
      console.log(`${C.red}  failed to start ${svc.name}: ${err.message}${C.reset}`);
    });

    child.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.log(`${C.red}  ${svc.name} exited with code ${code}${C.reset}`);
      }
      s.process = null;
    });
  }, 2000);
}

// ── Monitor Loop ────────────────────────────────────────────────────────────

async function checkAll() {
  const checks = SERVICES.map(async (svc) => {
    const result = await checkHealth(svc.url);
    const s = state[svc.name];

    if (result.ok) {
      if (s.downSince) {
        const downMs = Date.now() - s.downSince;
        console.log(`${C.green}[RECOVERED] ${svc.name}${C.reset} ${C.dim}(was down ${Math.round(downMs / 1000)}s)${C.reset}`);
        // Reset restart count after stable recovery
        setTimeout(() => { s.restarts = 0; }, 60_000);
      }
      s.downSince = null;
      s.consecutiveFails = 0;
    } else {
      s.consecutiveFails++;
      if (!s.downSince) {
        s.downSince = Date.now();
        console.log(`${C.red}[DOWN] ${svc.name}${C.reset} ${C.dim}(port ${svc.port}, status ${result.status})${C.reset}`);
      }
      // Only restart after 2 consecutive failures to avoid flapping
      if (s.consecutiveFails >= 2) {
        restartService(svc);
      }
    }
  });

  await Promise.all(checks);
}

// ── Startup ─────────────────────────────────────────────────────────────────

console.log('');
console.log(`${C.cyan}${C.bold}╔══════════════════════════════════════╗${C.reset}`);
console.log(`${C.cyan}${C.bold}║   Resume Builder — Service Watchdog  ║${C.reset}`);
console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════╝${C.reset}`);
console.log(`${C.dim}  Checking every ${CHECK_INTERVAL_MS / 1000}s | Max restarts: ${MAX_RESTARTS}${C.reset}`);
console.log(`${C.dim}  Services: ${SERVICES.map((s) => s.name).join(', ')}${C.reset}`);
console.log('');

// Run first check immediately
await checkAll();

// Schedule recurring checks
const interval = setInterval(checkAll, CHECK_INTERVAL_MS);

// ── Graceful Shutdown ───────────────────────────────────────────────────────

function shutdown() {
  console.log(`\n${C.yellow}[WATCHDOG] Shutting down...${C.reset}`);
  clearInterval(interval);

  // Kill child processes we spawned
  for (const svc of SERVICES) {
    const s = state[svc.name];
    if (s.process && !s.process.killed) {
      try { s.process.kill(); } catch {}
    }
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep alive
process.on('uncaughtException', (err) => {
  console.error(`${C.red}[WATCHDOG ERROR] ${err.message}${C.reset}`);
});

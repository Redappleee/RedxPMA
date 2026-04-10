import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import process from "node:process";

const PORT = Number(process.env.SERVER_PORT || process.env.API_PORT || 4000);
const HEALTH_URL =
  process.env.SERVER_HEALTH_URL || process.env.API_HEALTH_URL || `http://127.0.0.1:${PORT}/api/health`;
const CHECK_INTERVAL_MS = 3000;
const MAX_CONSECUTIVE_FAILURES = 3;
const SERVER_LOG_PATH = "/tmp/nexus-labs-server.log";
const CHILD_PID_PATH = "/tmp/nexus-labs-server-supervisor-child.pid";

let child = null;
let failures = 0;
let shuttingDown = false;

const log = (message) => {
  // Keep logs compact; supervisor logs are tailed via npm scripts.
  // eslint-disable-next-line no-console
  console.log(`[server-supervisor ${new Date().toISOString()}] ${message}`);
};

const isPortListening = (port) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(1200);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });

const isHealthy = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(HEALTH_URL, { signal: controller.signal });
    if (!response.ok) return false;
    const json = await response.json().catch(() => null);
    return json?.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const startChild = () => {
  if (child && child.exitCode === null) return;

  const out = fs.openSync(SERVER_LOG_PATH, "a");
  child = spawn("npm", ["run", "dev:server:nowatch"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", out, out]
  });

  fs.writeFileSync(CHILD_PID_PATH, String(child.pid));
  log(`Started server child process (pid=${child.pid})`);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    log(`Server child exited (code=${code}, signal=${signal ?? "none"})`);
    child = null;
  });
};

const stopChild = (reason) => {
  if (!child || child.exitCode !== null) return;
  log(`Stopping server child (${reason})`);
  child.kill("SIGKILL");
  child = null;
  try {
    fs.unlinkSync(CHILD_PID_PATH);
  } catch {
    // ignore
  }
};

const monitor = async () => {
  if (!child || child.exitCode !== null) {
    startChild();
    return;
  }

  const listening = await isPortListening(PORT);
  const healthy = listening ? await isHealthy() : false;

  if (healthy) {
    failures = 0;
    return;
  }

  failures += 1;
  log(`Health check failed (${failures}/${MAX_CONSECUTIVE_FAILURES})`);

  if (failures >= MAX_CONSECUTIVE_FAILURES) {
    failures = 0;
    stopChild("unhealthy");
    startChild();
  }
};

const shutdown = (signal) => {
  shuttingDown = true;
  log(`Received ${signal}, shutting down supervisor`);
  stopChild(signal);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

log(`Supervisor online (port=${PORT}, health=${HEALTH_URL})`);
startChild();
setInterval(() => {
  monitor().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`Monitor error: ${message}`);
  });
}, CHECK_INTERVAL_MS);

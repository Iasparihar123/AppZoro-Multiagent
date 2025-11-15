import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs directory: orchestrator/logs
const logsDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Write a JSON log file for a given agent step.
 * @param {string} agent - "pm" | "tech" | "dev"
 * @param {any} payload - data to log
 */
export function logStep(agent, payload) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${agent}-${timestamp}.log`;
  const filePath = path.join(logsDir, fileName);

  const contents = JSON.stringify(payload, null, 2);

  fs.writeFileSync(filePath, contents, 'utf8');
}

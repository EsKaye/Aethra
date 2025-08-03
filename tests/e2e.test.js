// End-to-end tests ensuring our rituals stay battle-ready.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const { scheduleReminder } = require('../packages/voice-notes');

test('overlay server persists config and enforces rate limits', async () => {
  const configPath = path.join(__dirname, 'tmp-config.json');
  try { fs.unlinkSync(configPath); } catch {}

  const env = {
    ...process.env,
    OVERLAY_WS_TOKEN: 'secret',
    OVERLAY_RATE_LIMIT: '2',
    OVERLAY_CONFIG_PATH: configPath,
    OVERLAY_WS_PORT: '8090'
  };

  const server = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '../packages/overlay'),
    env,
    stdio: 'inherit'
  });

  // Wait for server to boot.
  await new Promise(res => setTimeout(res, 500));

  const ws = new WebSocket('ws://localhost:8090?token=secret');
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  ws.send(JSON.stringify({ type: 'config:update', payload: { moon: 'selene' } }));
  await new Promise(res => setTimeout(res, 100));

  assert.ok(fs.existsSync(configPath));
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  assert.equal(cfg.moon, 'selene');

  // Exceed rate limit to ensure server defends itself.
  ws.send('spam1');
  ws.send('spam2');
  ws.send('spam3');
  await new Promise(res => ws.on('close', res));

  server.kill();
});

test('scheduleReminder creates calendar artifacts', () => {
  const eventsDir = path.join(__dirname, '../packages/voice-notes/events');
  // Ensure the directory exists and is empty.
  fs.rmSync(eventsDir, { recursive: true, force: true });
  fs.mkdirSync(eventsDir, { recursive: true });

  // Use a 1-second window so tests don't linger for minutes waiting for schedule.
  const result = scheduleReminder('remind me in 1 second to stretch');
  assert.ok(result && result.id);

  const icsPath = path.join(eventsDir, `${result.id}.ics`);
  assert.ok(fs.existsSync(icsPath));
});


#!/usr/bin/env node
/**
 * Overlay WebSocket Server
 * Hardened with token auth, per-client rate limits, config persistence,
 * and graceful shutdown hooks so stream overlays survive cosmic storms.
 */

import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve directory for persistent config storage relative to this file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.OVERLAY_WS_PORT || 8080;
const TOKEN = process.env.OVERLAY_WS_TOKEN;
const RATE_LIMIT = Number(process.env.OVERLAY_RATE_LIMIT || 60); // msgs/minute per client
const CONFIG_PATH = process.env.OVERLAY_CONFIG_PATH || path.join(__dirname, 'config.json');

if (!TOKEN) {
  console.warn('OVERLAY_WS_TOKEN not set. Connections will be rejected.');
}

// Load persisted config so overlay state returns after restarts.
let overlayConfig = {};
try {
  overlayConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} catch {
  // No existing config; defaults to empty object.
}

const wss = new WebSocketServer({ port: PORT });

// Simple token bucket map keyed by remote address for rate limiting.
const rateMap = new Map();
const isRateLimited = key => {
  const now = Date.now();
  const windowMs = 60_000;
  const info = rateMap.get(key) || { count: 0, start: now };
  if (now - info.start > windowMs) {
    info.count = 0;
    info.start = now;
  }
  info.count++;
  rateMap.set(key, info);
  return info.count > RATE_LIMIT;
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const provided = url.searchParams.get('token');
  if (!TOKEN || provided !== TOKEN) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Send current config immediately so clients mirror state.
  ws.send(JSON.stringify({ type: 'config:init', payload: overlayConfig }));

  ws.on('message', data => {
    const key = req.socket.remoteAddress;
    if (isRateLimited(key)) {
      ws.close(1013, 'Rate limit exceeded');
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'config:update') {
        overlayConfig = { ...overlayConfig, ...msg.payload };
        // Persist to disk to survive process death.
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(overlayConfig, null, 2));
      }
      // Broadcast refreshed config to all connected clients.
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({ type: 'config', payload: overlayConfig }));
        }
      });
    } catch (err) {
      console.error('Invalid message received', err);
    }
  });
});

// Gracefully close server on interrupt so clients aren't orphaned.
const shutdown = () => {
  console.log('🌙 Overlay server shutting down...');
  wss.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`🔆 Overlay WebSocket server running on ws://localhost:${PORT}`);


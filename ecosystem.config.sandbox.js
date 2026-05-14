// ═══════════════════════════════════════════════════════════════
// Hache IA - PM2 Ecosystem for Z.ai Sandbox
// ═══════════════════════════════════════════════════════════════
// Este archivo se usa SOLO en el sandbox de Z.ai.
// En el VPS, usar ecosystem.config.js en su lugar.
//
// Uso en sandbox:
//   pm2 start ecosystem.config.sandbox.js
//   pm2 status
//   pm2 logs
// ═══════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    // ─────────────────────────────────────
    // Proxy Server (relay to Z.ai internal API)
    // ─────────────────────────────────────
    {
      name: "proxy",
      script: "proxy-server.mjs",
      interpreter: "node",
      env: {
        PROXY_PORT: 3000,
        BLOCK_DIRECT_ACCESS: "true",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: "256M",
      error_file: "/home/z/.pm2/logs/proxy-error.log",
      out_file: "/home/z/.pm2/logs/proxy-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      listen_timeout: 15000,
      kill_timeout: 10000,
    },

    // ─────────────────────────────────────
    // Keep-alive (ping proxy para evitar sleep)
    // ─────────────────────────────────────
    {
      name: "keepalive",
      script: "keepalive.mjs",
      interpreter: "node",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 10000,
      watch: false,
      max_memory_restart: "64M",
      error_file: "/home/z/.pm2/logs/keepalive-error.log",
      out_file: "/home/z/.pm2/logs/keepalive-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};

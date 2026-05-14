// ═══════════════════════════════════════════════════════════════
// Hache IA - PM2 Ecosystem Configuration
// ═══════════════════════════════════════════════════════════════
// Uso:
//   pm2 start ecosystem.config.js
//   pm2 status
//   pm2 logs
//   pm2 restart all
//   pm2 stop all
// ═══════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    // ─────────────────────────────────────
    // App: Next.js (HacheCode Frontend + API)
    // ─────────────────────────────────────
    {
      name: "hache-ia",
      script: "npm",
      args: "start",
      cwd: "/root/HacheCode",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        API_BASE_URL: "https://api.hacheia.xyz",
        API_KEY: "hache-ia-proxy",
        API_MODEL: "glm-4-plus",
      },
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      // Memory
      max_memory_restart: "512M",
      // Logs
      error_file: "/root/.pm2/logs/hache-ia-error.log",
      out_file: "/root/.pm2/logs/hache-ia-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Timing
      listen_timeout: 30000,
      kill_timeout: 10000,
      // Graceful shutdown
      shutdown_with_message: true,
    },

    // ─────────────────────────────────────
    // App: Proxy Server (sandbox only)
    // Solo se usa en el sandbox de Z.ai
    // No necesario en VPS - Next.js habla directamente con api.hacheia.xyz
    // ─────────────────────────────────────
    // {
    //   name: "proxy",
    //   script: "proxy-server.mjs",
    //   interpreter: "node",
    //   cwd: "/root/HacheCode",
    //   env: {
    //     PROXY_PORT: 3000,
    //     BLOCK_DIRECT_ACCESS: "true",
    //   },
    //   autorestart: true,
    //   max_restarts: 10,
    //   restart_delay: 5000,
    //   watch: false,
    //   max_memory_restart: "256M",
    //   error_file: "/root/.pm2/logs/proxy-error.log",
    //   out_file: "/root/.pm2/logs/proxy-out.log",
    //   log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    //   merge_logs: true,
    //   listen_timeout: 15000,
    //   kill_timeout: 10000,
    // },

    // ─────────────────────────────────────
    // App: Keep-alive (sandbox only)
    // Hace ping al proxy para mantener el sandbox despierto
    // ─────────────────────────────────────
    // {
    //   name: "keepalive",
    //   script: "keep-alive.mjs",
    //   interpreter: "node",
    //   cwd: "/root/HacheCode",
    //   autorestart: true,
    //   max_restarts: 5,
    //   restart_delay: 10000,
    //   watch: false,
    //   max_memory_restart: "64M",
    //   error_file: "/root/.pm2/logs/keepalive-error.log",
    //   out_file: "/root/.pm2/logs/keepalive-out.log",
    //   log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    // },
  ],
};

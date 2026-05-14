// ═══════════════════════════════════════════════════════════════
// Hache IA - Keep Alive Script
// ═══════════════════════════════════════════════════════════════
// Mantiene el sandbox de Z.ai despierto haciendo ping al proxy
// cada 30 segundos. Se usa solo en el sandbox, no en el VPS.
// ═══════════════════════════════════════════════════════════════

const PING_URL = 'http://localhost:3000/health';
const INTERVAL = 30000; // 30 segundos

let consecutiveErrors = 0;
const MAX_ERRORS = 5;

async function ping() {
  try {
    const res = await fetch(PING_URL, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    consecutiveErrors = 0;
    const ts = new Date().toISOString();
    console.log(`[${ts}] Keep-alive OK - uptime: ${Math.floor(data.uptime || 0)}s`);
  } catch (err) {
    consecutiveErrors++;
    const ts = new Date().toISOString();
    console.error(`[${ts}] Keep-alive FAILED (${consecutiveErrors}/${MAX_ERRORS}): ${err.message}`);
    
    if (consecutiveErrors >= MAX_ERRORS) {
      console.error(`[${ts}] Too many errors, proxy may be down!`);
      consecutiveErrors = 0; // Reset to avoid spam
    }
  }
}

console.log(`[Keep-Alive] Starting - pinging ${PING_URL} every ${INTERVAL/1000}s`);
ping(); // Initial ping
setInterval(ping, INTERVAL);

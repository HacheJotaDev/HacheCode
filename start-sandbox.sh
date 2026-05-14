#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Hache IA - Iniciar servicios en Sandbox Z.ai
# ═══════════════════════════════════════════════════════════════
# Ejecutar en el sandbox de Z.ai:
#   chmod +x start-sandbox.sh
#   ./start-sandbox.sh
#
# Inicia:
#   - Proxy server (puerto 3000, relay a API interna Z.ai)
#   - Keep-alive (ping cada 30s para evitar sleep del sandbox)
#
# El proxy se expone via Cloudflare Named Tunnel (api.hacheia.xyz)
# configurado aparte con: cloudflared tunnel run hache-ia
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  Hache IA - Sandbox Startup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Limpiar procesos anteriores
pm2 delete proxy 2>/dev/null || true
pm2 delete keepalive 2>/dev/null || true
sleep 2

# Iniciar el proxy server
echo "[1/3] Iniciando proxy server..."
pm2 start proxy-server.mjs --name proxy --interpreter node
sleep 3

# Verificar que el proxy funciona
PROXY_STATUS=$(curl -s http://localhost:3000/health 2>/dev/null)
if echo "$PROXY_STATUS" | grep -q "ok"; then
  echo "  ✅ Proxy server activo en puerto 3000"
else
  echo "  ❌ Proxy server falló. Revisa: pm2 logs proxy"
  exit 1
fi

# Iniciar keep-alive
echo "[2/3] Iniciando keep-alive..."
pm2 start keepalive.mjs --name keepalive --interpreter node
echo "  ✅ Keep-alive activo (ping cada 30s)"

# Guardar configuracion PM2
pm2 save 2>/dev/null || true

# Verificar tunnel
echo "[3/3] Verificando Cloudflare Tunnel..."
sleep 2
TUNNEL_STATUS=$(curl -s https://api.hacheia.xyz/health 2>/dev/null)
if echo "$TUNNEL_STATUS" | grep -q "ok"; then
  echo "  ✅ Cloudflare Tunnel activo (api.hacheia.xyz)"
else
  echo "  ⚠️  Cloudflare Tunnel no responde"
  echo "  Verifica que cloudflared tunnel run este activo"
  echo "  Comando: cloudflared tunnel run hache-ia"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Sandbox listo!"
echo "═══════════════════════════════════════════════════════════"
echo "  Proxy:       http://localhost:3000"
echo "  Health:      http://localhost:3000/health"
echo "  Public:      https://api.hacheia.xyz"
echo ""
echo "  Comandos utiles:"
echo "    pm2 status     - Ver estado"
echo "    pm2 logs       - Ver logs"
echo "    pm2 restart all - Reiniciar todo"
echo "═══════════════════════════════════════════════════════════"

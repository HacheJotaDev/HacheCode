#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Hache Code - Iniciar Proxy + Túnel Cloudflare
# ═══════════════════════════════════════════════════════════
# Ejecutar este script cuando el codespace se inicie.
# El túnel URL cambia cada vez que se reinicia.
# Actualizar ZAI_PROXY_URL en Vercel con la nueva URL.

echo "🚀 Iniciando Hache Code Proxy + Túnel..."

# Limpiar procesos anteriores
pm2 delete proxy 2>/dev/null
pm2 delete tunnel 2>/dev/null
sleep 2

# Iniciar el proxy server
pm2 start /home/z/my-project/proxy-server.mjs --name proxy --interpreter node
sleep 3

# Verificar que el proxy funciona
PROXY_STATUS=$(curl -s http://localhost:3000/health 2>/dev/null)
if echo "$PROXY_STATUS" | grep -q "ok"; then
  echo "✅ Proxy server activo en puerto 3000"
else
  echo "❌ Proxy server falló. Revisa los logs: pm2 logs proxy"
  exit 1
fi

# Iniciar el túnel Cloudflare
pm2 start cloudflared --name tunnel -- tunnel --url http://localhost:3000 --protocol http2
sleep 15

# Obtener la URL del túnel
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /home/z/.pm2/logs/tunnel-error.log 2>/dev/null | tail -1)

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ No se pudo obtener la URL del túnel"
  echo "   Revisa los logs: pm2 logs tunnel"
  exit 1
fi

# Guardar la URL
echo "$TUNNEL_URL" > /tmp/tunnel-url

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🌐 TÚNEL ACTIVO: $TUNNEL_URL"
echo ""
echo "📋 En Vercel, configura esta variable de entorno:"
echo "   ZAI_PROXY_URL=$TUNNEL_URL"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - El túnel URL cambia cada vez que reinicias"
echo "   - Si deja de funcionar, ejecuta este script de nuevo"
echo "   - Actualiza ZAI_PROXY_URL en Vercel con la nueva URL"
echo "═══════════════════════════════════════════════════════════"

# Guardar pm2
pm2 save 2>/dev/null

# Verificar que el túnel funciona
sleep 3
echo ""
echo -n "🔍 Verificando túnel... "
HEALTH=$(timeout 10 curl -s "$TUNNEL_URL/health" 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Funciona!"
else
  echo "⚠️  Puede necesitar unos segundos para estabilizarse"
fi

#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Hache IA - Deploy Script para VPS
# ═══════════════════════════════════════════════════════════════
# Ejecutar en el VPS como root:
#   chmod +x deploy-vps.sh
#   ./deploy-vps.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  Hache IA - Deploy en VPS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. Instalar dependencias ──
echo "[1/7] Instalando dependencias del sistema..."
if ! command -v node &> /dev/null; then
  echo "  Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
  echo "  Instalando PM2..."
  npm install -g pm2
fi

echo "  Node: $(node -v)"
echo "  npm: $(npm -v)"
echo "  PM2: $(pm2 -v)"
echo ""

# ── 2. Clonar repositorio ──
echo "[2/7] Clonando repositorio..."
DEPLOY_DIR="/root/HacheCode"

if [ -d "$DEPLOY_DIR" ]; then
  echo "  Actualizando repositorio existente..."
  cd "$DEPLOY_DIR"
  git pull origin main 2>/dev/null || echo "  Warning: No se pudo hacer pull (posible cambios locales)"
else
  echo "  Clonando por primera vez..."
  git clone https://github.com/HacheJotaDev/HacheCode.git "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi
echo ""

# ── 3. Instalar dependencias npm ──
echo "[3/7] Instalando dependencias npm..."
npm install --production=false
echo ""

# ── 4. Build de Next.js ──
echo "[4/7] Compilando Next.js..."
npm run build
echo ""

# ── 5. Crear .env.local ──
echo "[5/7] Configurando variables de entorno..."
cat > .env.local << 'EOF'
API_BASE_URL=https://api.hacheia.xyz
API_KEY=hache-ia-proxy
API_MODEL=glm-4-plus
EOF
echo "  .env.local configurado"
echo ""

# ── 6. Detener procesos anteriores ──
echo "[6/7] Deteniendo procesos anteriores..."
pm2 delete hache-ia 2>/dev/null || true
pm2 save 2>/dev/null || true
echo ""

# ── 7. Iniciar con PM2 ──
echo "[7/7] Iniciando Hache IA con PM2..."
pm2 start ecosystem.config.js
pm2 save
echo ""

# ── Verificacion ──
echo "═══════════════════════════════════════════════════════════"
echo "  Verificando..."
echo "═══════════════════════════════════════════════════════════"

sleep 5

# Verificar que la app esta corriendo
if pm2 pid hache-ia > /dev/null 2>&1; then
  echo "  ✅ Hache IA corriendo (PID: $(pm2 pid hache-ia))"
else
  echo "  ❌ Hache IA no se inicio correctamente"
  echo "  Revisa los logs: pm2 logs hache-ia"
  exit 1
fi

# Verificar API de salud
sleep 3
HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo "  ✅ API /health respondiendo: $HEALTH"
else
  echo "  ⚠️  API /health no responde aun (puede necesitar mas tiempo)"
  echo "  Verifica manualmente: curl http://localhost:3001/api/health"
fi

# Verificar conexion con el proxy
PROXY_HEALTH=$(curl -s https://api.hacheia.xyz/health 2>/dev/null)
if echo "$PROXY_HEALTH" | grep -q "ok"; then
  echo "  ✅ Proxy Cloudflare respondiendo: $PROXY_HEALTH"
else
  echo "  ⚠️  Proxy Cloudflare no responde"
  echo "  Verifica que el sandbox este corriendo y el tunnel este activo"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Deploy completado!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Comandos utiles:"
echo "    pm2 status              - Ver estado de procesos"
echo "    pm2 logs hache-ia       - Ver logs de la app"
echo "    pm2 restart hache-ia    - Reiniciar la app"
echo "    pm2 monit               - Monitor en tiempo real"
echo ""
echo "  URLs:"
echo "    App:       http://localhost:3001"
echo "    API:       http://localhost:3001/api/health"
echo "    Proxy:     https://api.hacheia.xyz/health"
echo ""
echo "  Para auto-inicio al reiniciar VPS:"
echo "    pm2 startup"
echo "    (ejecutar el comando que muestra pm2)"
echo "═══════════════════════════════════════════════════════════"

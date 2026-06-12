#!/usr/bin/env bash
# =============================================================================
# deploy.sh — ISHIRO Art Portfolio — Production Deploy Script
# Usage (on naski server): ./deploy.sh
# =============================================================================
set -e

APP_DIR="/home/naski/ishiro-art"
LOG="/tmp/ishiro-art-deploy.log"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ISHIRO Art — Deploying to production   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$APP_DIR"

# ── 1. Pull latest from main ──────────────────────────────────────────────────
echo "[1/4] Pulling latest changes from GitHub..."
git pull origin main

# ── 2. Apply DB schema changes ────────────────────────────────────────────────
echo "[2/4] Applying database schema..."
npx prisma db push --accept-data-loss=false

# ── 3. Build Next.js ──────────────────────────────────────────────────────────
echo "[3/4] Building Next.js..."
npm run build

# ── 4. Restart server ─────────────────────────────────────────────────────────
echo "[4/4] Restarting next-server..."
pkill -f 'next-server' || true
sleep 1
nohup npm run start > "$LOG" 2>&1 &

# Wait for startup
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")

echo ""
if [ "$STATUS" = "200" ]; then
  echo "✅ Deploy complete! Server responding HTTP $STATUS"
  echo "   Commit: $(git log --oneline -1)"
else
  echo "⚠️  Server returned HTTP $STATUS — check logs: $LOG"
fi
echo ""

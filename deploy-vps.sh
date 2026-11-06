#!/usr/bin/env bash
# ==============================================================================
# Script de Deploy Automatizado do saasCONSTRUCT MVP 1 na sua VPS
# Requisitos: Ubuntu 20.04/22.04/24.04 ou Debian 11/12
# ==============================================================================

set -e

echo "🚀 Iniciando preparação do ambiente na VPS..."

# 1. Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker e Docker Compose se não existirem
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo apt install -y docker-compose-plugin docker-compose
fi

# 3. Subir o sistema com Docker Compose
echo "🔨 Construindo e iniciando serviços (PostgreSQL 16 + Node.js Express + React SPA)..."
docker-compose up -d --build

echo "✅ saasCONSTRUCT MVP 1 está rodando com sucesso na sua VPS!"
echo "🌐 Acesse: http://SEU_IP_VPS:3000"
echo "📊 Banco PostgreSQL: localhost:5432 (banco: mvp1_adequacao)"

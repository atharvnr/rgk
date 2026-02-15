#!/usr/bin/env bash
set -euo pipefail

echo "=== RGK Droplet Bootstrap ==="

# Install Docker
if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Nginx
if ! command -v nginx &>/dev/null; then
    echo "Installing Nginx..."
    apt-get update -qq && apt-get install -y -qq nginx
fi

# Install SSL certs
echo "Installing SSL certificates..."
mkdir -p /etc/ssl/cloudflare
cp /root/rgk/infra/ssl/cert.pem /etc/ssl/cloudflare/cert.pem
cp /root/rgk/infra/ssl/key.pem /etc/ssl/cloudflare/key.pem
chmod 600 /etc/ssl/cloudflare/key.pem

# Configure Nginx
echo "Configuring Nginx..."
cp /root/rgk/infra/nginx/api.rentgrandkids.org /etc/nginx/sites-available/
cp /root/rgk/infra/nginx/rentgrandkids.org /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/api.rentgrandkids.org /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/rentgrandkids.org /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Create web root
mkdir -p /var/www/rgk

# GHCR login for Watchtower
echo "Configuring GHCR access..."
mkdir -p /root/.docker
echo "{\"auths\":{\"ghcr.io\":{\"auth\":\"$(echo -n "${GHCR_USER}:${GHCR_PAT}" | base64)\"}}}" > /root/.docker/config.json

# Copy .env for docker-compose
echo "Setting up environment..."
cp /root/rgk/infra/.env /root/rgk/.env

# Deploy
echo "Starting services..."
docker compose -f /root/rgk/docker-compose.yml up -d

echo "=== Bootstrap complete ==="

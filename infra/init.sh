#!/usr/bin/env bash
set -euo pipefail

echo "=== RGK Droplet Bootstrap ==="

# Swap (the API, Mongo and Redis share a small droplet; swap keeps the OOM killer away)
SWAP_SIZE="${SWAP_SIZE:-2G}"
if ! swapon --show | grep -q '^/swapfile'; then
    echo "Creating ${SWAP_SIZE} swap file..."
    fallocate -l "${SWAP_SIZE}" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl -w vm.swappiness=10
    grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

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

# Harden SSH: key-only root login
if [ -f /etc/ssh/sshd_config.d/50-cloud-init.conf ]; then
    sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf
    systemctl reload ssh || true
fi

# GHCR login for Watchtower
echo "Configuring GHCR access..."
mkdir -p /root/.docker
echo "{\"auths\":{\"ghcr.io\":{\"auth\":\"$(echo -n "${GHCR_USER}:${GHCR_PAT}" | base64)\"}}}" > /root/.docker/config.json

# Deploy
echo "Starting services..."
docker compose -f /root/rgk/infra/docker-compose.yml pull
docker compose -f /root/rgk/infra/docker-compose.yml up -d

# Restore a Mongo dump if one was uploaded (see infra/migrate-mongo.sh)
if [ -d /root/rgk/mongo-dump/rgk ]; then
    echo "Restoring MongoDB dump..."
    docker cp /root/rgk/mongo-dump rgk-mongo:/tmp/mongo-dump
    docker exec rgk-mongo mongorestore --drop --db rgk /tmp/mongo-dump/rgk
    docker exec rgk-mongo rm -rf /tmp/mongo-dump
    mv /root/rgk/mongo-dump "/root/rgk/mongo-dump.restored-$(date +%Y%m%d%H%M%S)"
fi

# Nightly Mongo backup (kept 7 days)
cat > /etc/cron.daily/rgk-mongo-backup <<'EOF'
#!/usr/bin/env bash
set -e
mkdir -p /root/backups
docker exec rgk-mongo mongodump --db rgk --archive --gzip > "/root/backups/rgk-$(date +%F).archive.gz"
find /root/backups -name 'rgk-*.archive.gz' -mtime +7 -delete
EOF
chmod +x /etc/cron.daily/rgk-mongo-backup

echo "=== Bootstrap complete ==="
docker compose -f /root/rgk/infra/docker-compose.yml ps

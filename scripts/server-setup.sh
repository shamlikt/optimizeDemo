#!/bin/bash
# Server Setup Script for OptimizeFlow
# Run as root: sudo bash server-setup.sh
set -euo pipefail

echo "=== OptimizeFlow Server Setup ==="

# 1. Update system
echo "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    echo "Docker installed successfully"
else
    echo "Docker already installed: $(docker --version)"
fi

# 3. Install Docker Compose plugin (if not included)
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
fi
echo "Docker Compose: $(docker compose version)"

# 4. Add optimize user to docker group
usermod -aG docker optimize
echo "Added optimize user to docker group"

# 5. Enable Docker on boot
systemctl enable docker
systemctl start docker

# 6. Grant optimize user passwordless sudo for docker commands
cat > /etc/sudoers.d/optimize << 'EOF'
optimize ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/bin/systemctl restart docker, /usr/bin/systemctl start docker, /usr/bin/systemctl stop docker
EOF
chmod 440 /etc/sudoers.d/optimize
echo "Granted optimize user Docker sudo permissions"

# 7. Create app directory
APP_DIR="/home/optimize/optimizeFlow"
mkdir -p "$APP_DIR"
chown optimize:optimize "$APP_DIR"
echo "Created app directory: $APP_DIR"

# 8. Setup firewall (allow SSH + HTTP)
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable 2>/dev/null || true
    echo "Firewall configured (SSH, HTTP, HTTPS)"
fi

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Copy .env.production.example to /home/optimize/optimizeFlow/.env.production"
echo "  2. Edit .env.production with strong passwords"
echo "  3. Configure GitHub Actions secrets (SSH_PRIVATE_KEY, SSH_HOST, SSH_USER)"
echo "  4. Push to main branch to trigger deployment"

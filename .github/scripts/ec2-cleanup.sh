#!/bin/bash

#############################################
# EC2 Disk Cleanup Script
# Purpose: Free up disk space before deployment
# Safe to run before each deployment
#############################################

set -e

echo "========================================="
echo "EC2 Disk Cleanup Script"
echo "========================================="
echo ""

# Function to print disk usage
print_disk_usage() {
    echo "Current disk usage:"
    df -h / | grep -v Filesystem
    echo ""
}

# Print initial disk usage
echo "BEFORE CLEANUP:"
print_disk_usage

#############################################
# 1. Clean old deployment artifacts in /tmp
#############################################
echo "Cleaning old deployment artifacts..."
find /tmp -name "*.tar.gz" -type f -mtime +1 -delete 2>/dev/null || true
find /tmp -name "*-deploy.tar.gz" -type f -delete 2>/dev/null || true
echo "  - Removed old .tar.gz files from /tmp"

#############################################
# 2. Clean PM2 logs older than 7 days
#############################################
echo "Cleaning old PM2 logs..."
if [ -d "$HOME/.pm2/logs" ]; then
    find $HOME/.pm2/logs -type f -mtime +7 -delete 2>/dev/null || true
    echo "  - Removed PM2 logs older than 7 days"
else
    echo "  - No PM2 logs directory found"
fi

#############################################
# 3. Clean system package manager cache
#############################################
echo "Cleaning system package cache..."
# Clean apt cache (Debian/Ubuntu)
if command -v apt-get &> /dev/null; then
    sudo apt-get clean 2>/dev/null || true
    sudo apt-get autoclean 2>/dev/null || true
    echo "  - Cleaned apt cache"
fi

# Clean yum cache (RHEL/CentOS/Amazon Linux)
if command -v yum &> /dev/null; then
    sudo yum clean all 2>/dev/null || true
    echo "  - Cleaned yum cache"
fi

#############################################
# 4. Clean Docker resources (if installed)
#############################################
echo "Cleaning Docker resources..."
if command -v docker &> /dev/null; then
    # Remove dangling images
    docker image prune -f 2>/dev/null || true
    # Remove stopped containers older than 24h
    docker container prune -f --filter "until=24h" 2>/dev/null || true
    # Remove unused networks
    docker network prune -f 2>/dev/null || true
    echo "  - Cleaned Docker images and containers"
else
    echo "  - Docker not installed, skipping"
fi

#############################################
# 5. Clean temporary files
#############################################
echo "Cleaning temporary files..."
# Remove files in /tmp older than 7 days (excluding system files)
find /tmp -type f -mtime +7 -not -path "*/systemd*" -not -path "*/ssh*" -delete 2>/dev/null || true
# Remove empty directories in /tmp
find /tmp -type d -empty -delete 2>/dev/null || true
echo "  - Removed old temporary files"

#############################################
# 6. Clean yarn/npm cache (limited cleanup)
#############################################
echo "Cleaning yarn/npm cache..."
if command -v yarn &> /dev/null; then
    yarn cache clean 2>/dev/null || true
    echo "  - Cleaned yarn cache"
fi

if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null || true
    echo "  - Cleaned npm cache"
fi

#############################################
# 7. Clean journalctl logs (keep last 3 days)
#############################################
echo "Cleaning system logs..."
if command -v journalctl &> /dev/null; then
    sudo journalctl --vacuum-time=3d 2>/dev/null || true
    echo "  - Cleaned old system logs"
fi

#############################################
# 8. Remove old node_modules backups
#############################################
echo "Cleaning old node_modules backups..."
if [ -d "/var/www/noticias-pachuca" ]; then
    find /var/www/noticias-pachuca -type d -name "node_modules.bak*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    find /var/www/noticias-pachuca -type d -name "node_modules.old*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    echo "  - Removed old node_modules backups"
fi

#############################################
# 9. Find and report large files (informational)
#############################################
echo ""
echo "Top 10 largest files (for information):"
find / -type f -size +100M -exec du -h {} + 2>/dev/null | sort -rh | head -10 || echo "  - Unable to scan for large files"

#############################################
# Final disk usage report
#############################################
echo ""
echo "========================================="
echo "AFTER CLEANUP:"
print_disk_usage
echo "========================================="
echo "Cleanup completed successfully!"

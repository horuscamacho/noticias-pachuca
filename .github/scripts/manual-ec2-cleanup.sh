#!/bin/bash

#############################################
# Manual EC2 Disk Cleanup Script
# Purpose: Emergency disk cleanup for EC2 instance
# Usage: Run directly on EC2 via SSH
#   ssh user@host 'bash -s' < manual-ec2-cleanup.sh
#############################################

set -e

echo "========================================="
echo "MANUAL EC2 DISK CLEANUP SCRIPT"
echo "========================================="
echo ""

# Function to print disk usage
print_disk_usage() {
    echo "Current disk usage:"
    df -h / | grep -v Filesystem
    USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | sed 's/%//')
    echo "Disk usage: ${USAGE}%"
    echo ""
}

# Print initial disk usage
echo "BEFORE CLEANUP:"
print_disk_usage
BEFORE_USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | sed 's/%//')

#############################################
# 1. Clean ALL tar.gz files from /tmp
#############################################
echo "Cleaning deployment artifacts from /tmp..."
OLD_TARS=$(find /tmp -name "*.tar.gz" -type f 2>/dev/null | wc -l)
find /tmp -name "*.tar.gz" -type f -delete 2>/dev/null || true
echo "  - Removed ${OLD_TARS} .tar.gz files from /tmp"

#############################################
# 2. Clean ALL PM2 logs (keeping only last 100 lines)
#############################################
echo "Cleaning PM2 logs..."
if [ -d "$HOME/.pm2/logs" ]; then
    LOG_COUNT=0
    for logfile in $HOME/.pm2/logs/*.log; do
        if [ -f "$logfile" ]; then
            # Keep last 100 lines, truncate the rest
            tail -n 100 "$logfile" > "$logfile.tmp" && mv "$logfile.tmp" "$logfile"
            LOG_COUNT=$((LOG_COUNT + 1))
        fi
    done
    echo "  - Truncated ${LOG_COUNT} PM2 log files"
else
    echo "  - No PM2 logs directory found"
fi

#############################################
# 3. Clean system package manager cache
#############################################
echo "Cleaning system package cache..."
if command -v apt-get &> /dev/null; then
    sudo apt-get clean 2>/dev/null || true
    sudo apt-get autoclean 2>/dev/null || true
    sudo apt-get autoremove -y 2>/dev/null || true
    echo "  - Cleaned apt cache and removed unused packages"
fi

if command -v yum &> /dev/null; then
    sudo yum clean all 2>/dev/null || true
    echo "  - Cleaned yum cache"
fi

#############################################
# 4. Aggressive Docker cleanup
#############################################
echo "Cleaning Docker resources..."
if command -v docker &> /dev/null; then
    # Remove ALL unused images
    docker image prune -a -f 2>/dev/null || true
    # Remove ALL stopped containers
    docker container prune -f 2>/dev/null || true
    # Remove ALL unused volumes
    docker volume prune -f 2>/dev/null || true
    # Remove ALL unused networks
    docker network prune -f 2>/dev/null || true
    echo "  - Cleaned all unused Docker resources"
else
    echo "  - Docker not installed, skipping"
fi

#############################################
# 5. Clean ALL temporary files from /tmp
#############################################
echo "Cleaning all temporary files..."
# Remove all files in /tmp older than 1 day (excluding system files)
TEMP_FILES=$(find /tmp -type f -mtime +1 -not -path "*/systemd*" -not -path "*/ssh*" 2>/dev/null | wc -l)
find /tmp -type f -mtime +1 -not -path "*/systemd*" -not -path "*/ssh*" -delete 2>/dev/null || true
# Remove empty directories in /tmp
find /tmp -type d -empty -delete 2>/dev/null || true
echo "  - Removed ${TEMP_FILES} old temporary files"

#############################################
# 6. Aggressive yarn/npm cache cleanup
#############################################
echo "Cleaning yarn/npm cache..."
if command -v yarn &> /dev/null; then
    yarn cache clean --all 2>/dev/null || true
    echo "  - Cleaned yarn cache"
fi

if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null || true
    echo "  - Cleaned npm cache"
fi

#############################################
# 7. Clean system logs aggressively
#############################################
echo "Cleaning system logs..."
if command -v journalctl &> /dev/null; then
    sudo journalctl --vacuum-time=1d 2>/dev/null || true
    sudo journalctl --vacuum-size=100M 2>/dev/null || true
    echo "  - Cleaned system logs (keeping last 1 day / 100MB)"
fi

#############################################
# 8. Remove old node_modules backups
#############################################
echo "Cleaning old node_modules backups..."
if [ -d "/var/www/noticias-pachuca" ]; then
    BACKUP_DIRS=$(find /var/www/noticias-pachuca -type d \( -name "node_modules.bak*" -o -name "node_modules.old*" \) 2>/dev/null | wc -l)
    find /var/www/noticias-pachuca -type d \( -name "node_modules.bak*" -o -name "node_modules.old*" \) -exec rm -rf {} + 2>/dev/null || true
    echo "  - Removed ${BACKUP_DIRS} old node_modules backups"
fi

#############################################
# 9. Clean old build artifacts
#############################################
echo "Cleaning old build artifacts..."
if [ -d "/var/www/noticias-pachuca" ]; then
    # Remove old .output directories if they exist as backups
    OUTPUTS=$(find /var/www/noticias-pachuca -type d -name ".output.bak*" 2>/dev/null | wc -l)
    find /var/www/noticias-pachuca -type d -name ".output.bak*" -exec rm -rf {} + 2>/dev/null || true
    # Remove old dist directories if they exist as backups
    DISTS=$(find /var/www/noticias-pachuca -type d -name "dist.bak*" 2>/dev/null | wc -l)
    find /var/www/noticias-pachuca -type d -name "dist.bak*" -exec rm -rf {} + 2>/dev/null || true
    echo "  - Removed ${OUTPUTS} old .output and ${DISTS} old dist backups"
fi

#############################################
# 10. Find and report largest directories
#############################################
echo ""
echo "Top 10 largest directories in /var/www:"
if [ -d "/var/www" ]; then
    du -h --max-depth=3 /var/www 2>/dev/null | sort -rh | head -10 || echo "  - Unable to scan"
fi

echo ""
echo "Top 10 largest files (>50MB):"
find /var/www /tmp /home -type f -size +50M -exec du -h {} + 2>/dev/null | sort -rh | head -10 || echo "  - No large files found"

#############################################
# Final disk usage report
#############################################
echo ""
echo "========================================="
echo "AFTER CLEANUP:"
print_disk_usage
AFTER_USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | sed 's/%//')

FREED=$((BEFORE_USAGE - AFTER_USAGE))
echo "Disk space freed: ${FREED}%"
echo "========================================="
echo "Cleanup completed successfully!"
echo ""

# Warn if still critically low
if [ "$AFTER_USAGE" -gt 85 ]; then
    echo "WARNING: Disk usage is still critically high (${AFTER_USAGE}%)"
    echo "Consider:"
    echo "  1. Increasing EC2 instance disk size"
    echo "  2. Moving logs to external storage"
    echo "  3. Using separate volumes for application data"
fi

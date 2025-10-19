# EC2 Disk Cleanup Scripts

This directory contains disk cleanup scripts to prevent "No space left on device" errors during deployment.

## Overview

The deployment workflows now automatically run disk cleanup before each deployment to ensure sufficient disk space. However, manual cleanup scripts are also available for emergency situations.

## Automatic Cleanup (Integrated in CI/CD)

Both `deploy-api.yml` and `deploy-frontend.yml` now include a **"Cleanup EC2 disk space"** step that runs before copying files to EC2. This step:

1. Removes old deployment tar.gz files from /tmp
2. Cleans PM2 logs older than 7 days
3. Cleans system package manager cache (apt/yum)
4. Removes unused Docker images/containers (if Docker is installed)
5. Removes temporary files older than 7 days
6. Cleans yarn/npm cache
7. Cleans system logs (keeps last 3 days)

This runs automatically on every deployment and requires no manual intervention.

## Manual Cleanup Scripts

### 1. ec2-cleanup.sh
**Purpose:** Comprehensive but safe cleanup script
**Best for:** Regular maintenance or when you want detailed reporting

**Run via SSH:**
```bash
ssh user@host 'bash -s' < .github/scripts/ec2-cleanup.sh
```

**Features:**
- Shows before/after disk usage
- Lists top 10 largest files
- Safe defaults (7-day retention for logs)
- Preserves running applications

### 2. manual-ec2-cleanup.sh
**Purpose:** Aggressive emergency cleanup
**Best for:** Critical disk space situations (>90% usage)

**Run via SSH:**
```bash
ssh user@host 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
```

**Features:**
- More aggressive cleanup (1-day retention)
- Truncates PM2 logs instead of deleting
- Removes ALL unused Docker resources
- Shows largest directories and files
- Provides warnings if disk is still critically full

## What Gets Removed (Safe Items)

- Old deployment tar.gz files in /tmp
- PM2 logs older than specified days
- System package manager cache (apt/yum)
- Unused Docker images, containers, volumes, networks
- Temporary files in /tmp
- Yarn/npm cache
- Old system logs (journalctl)
- Old node_modules backups (*.bak, *.old)

## What NEVER Gets Removed

- Current running application files
- Active node_modules directories
- Database files
- Configuration files (.env, etc.)
- SSH keys
- PM2 process files
- System critical files

## Emergency Manual Cleanup on EC2

If you need to run cleanup directly on the EC2 instance:

```bash
# SSH into the server
ssh user@ec2-host

# Run inline cleanup commands
# Remove old deployment files
sudo find /tmp -name "*.tar.gz" -delete

# Clean PM2 logs
find ~/.pm2/logs -type f -mtime +7 -delete

# Clean package cache
sudo apt-get clean && sudo apt-get autoclean

# Clean Docker (if installed)
docker system prune -a -f

# Clean system logs
sudo journalctl --vacuum-time=1d

# Check disk usage
df -h
```

## Monitoring and Alerts

Consider setting up CloudWatch alarms for disk space:

```bash
# Create CloudWatch alarm for disk usage > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name ec2-disk-usage-high \
  --alarm-description "Alert when disk usage exceeds 80%" \
  --metric-name DiskSpaceUtilization \
  --namespace System/Linux \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Long-term Solutions

If disk space issues persist after cleanup:

1. **Increase EBS volume size:**
   ```bash
   # Modify volume size in AWS console or CLI
   aws ec2 modify-volume --volume-id vol-xxxxx --size 20

   # Then extend filesystem on EC2
   sudo growpart /dev/xvda 1
   sudo resize2fs /dev/xvda1
   ```

2. **Log rotation configuration:**
   Create `/etc/logrotate.d/pm2` on EC2:
   ```
   /home/ubuntu/.pm2/logs/*.log {
       daily
       rotate 7
       compress
       missingok
       notifempty
   }
   ```

3. **Separate volumes:**
   - Mount separate EBS volume for /var/www
   - Mount separate volume for logs
   - Use S3 for long-term log storage

## Troubleshooting

### Deployment still fails with "No space left on device"

1. **Check if cleanup ran successfully:**
   - Look for "Cleanup EC2 disk space" step in GitHub Actions logs
   - Verify before/after disk usage in logs

2. **Run manual aggressive cleanup:**
   ```bash
   ssh user@host 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
   ```

3. **Check for specific disk hogs:**
   ```bash
   ssh user@host
   du -h --max-depth=2 /var/www | sort -rh | head -20
   du -h --max-depth=1 /tmp | sort -rh
   ```

4. **Check inode usage:**
   ```bash
   df -i
   # If inodes are full, find directories with many files
   find /var/www -xdev -printf '%h\n' | sort | uniq -c | sort -rn | head -20
   ```

## Script Maintenance

The cleanup scripts are embedded in the GitHub Actions workflows using heredocs. If you need to update the cleanup logic:

1. Edit the cleanup script in the workflow file directly
2. Or extract to a separate script and reference it
3. Test changes on a non-production environment first

## Contact

For issues or questions about disk space management, contact the DevOps team.

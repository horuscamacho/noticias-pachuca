# EMERGENCY DISK CLEANUP - Quick Reference

## Immediate Action (Copy & Paste)

If deployment is failing with "No space left on device", run this NOW:

### Option 1: Run Manual Cleanup Script (Recommended)
```bash
# From your local machine
ssh ubuntu@your-ec2-host 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
```

### Option 2: Direct SSH Commands
```bash
# SSH into EC2
ssh ubuntu@your-ec2-host

# Run these commands
sudo find /tmp -name "*.tar.gz" -delete
find ~/.pm2/logs -type f -mtime +7 -delete
sudo apt-get clean && sudo apt-get autoclean
yarn cache clean 2>/dev/null || true
npm cache clean --force 2>/dev/null || true
sudo journalctl --vacuum-time=1d

# Check disk usage
df -h
```

### Option 3: Using GitHub Actions Secrets
```bash
# If you have EC2_SSH_KEY, EC2_USER, and EC2_HOST as env vars
echo "$EC2_SSH_KEY" > /tmp/key.pem
chmod 600 /tmp/key.pem
ssh -i /tmp/key.pem $EC2_USER@$EC2_HOST 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
rm /tmp/key.pem
```

## Check Disk Usage Quickly

```bash
ssh ubuntu@your-ec2-host 'df -h /'
```

## Nuclear Option (Use with Caution)

If nothing else works and you need space IMMEDIATELY:

```bash
ssh ubuntu@your-ec2-host

# WARNING: This will remove ALL files in /tmp
sudo find /tmp -type f -delete

# Clean ALL PM2 logs (keeps last 100 lines each)
for log in ~/.pm2/logs/*.log; do
    tail -n 100 "$log" > "$log.tmp" && mv "$log.tmp" "$log"
done

# Check space
df -h
```

## Prevention

The workflows now automatically clean before deployment. If you're seeing this error, either:
1. The auto-cleanup hasn't been deployed yet (commit and push the workflow changes)
2. The disk is critically undersized (consider increasing EBS volume)
3. There's a rogue process filling disk (investigate)

## Contact

If cleanup doesn't resolve the issue, escalate immediately.

## Quick Diagnosis

```bash
# Check what's using space
ssh ubuntu@your-ec2-host 'du -h --max-depth=2 /var/www | sort -rh | head -10'
ssh ubuntu@your-ec2-host 'du -h --max-depth=1 /tmp | sort -rh'
ssh ubuntu@your-ec2-host 'du -h ~/.pm2/logs | sort -rh | head -10'

# Check inode usage
ssh ubuntu@your-ec2-host 'df -i'
```

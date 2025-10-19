# Disk Space Issue - Resolution Summary

## Problem
EC2 instance ran out of disk space during frontend deployment with error:
```
tar: .output/public/manifest.json: Cannot open: No space left on device
tar: Exiting with failure status due to previous errors
```

## Solution Implemented

### 1. Automatic Pre-Deployment Cleanup (Primary Fix)

Both deployment workflows now include a **"Cleanup EC2 disk space"** step that runs BEFORE copying files:

**Files Modified:**
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/.github/workflows/deploy-api.yml`
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/.github/workflows/deploy-frontend.yml`

**What the cleanup does:**
1. Removes old .tar.gz deployment files from /tmp
2. Cleans PM2 logs older than 7 days
3. Cleans system package cache (apt/yum)
4. Removes unused Docker resources (if Docker is installed)
5. Removes temporary files older than 7 days
6. Cleans yarn/npm cache
7. Vacuums system logs (keeps last 3 days)
8. Shows before/after disk usage for monitoring

**Key Features:**
- Runs automatically on every deployment
- Safe - only removes old/temporary files
- Shows disk usage before and after in GitHub Actions logs
- Fails gracefully if any cleanup step has issues

### 2. Manual Cleanup Scripts (Emergency Use)

Created three scripts for manual intervention if needed:

#### a) ec2-cleanup.sh
**Location:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/.github/scripts/ec2-cleanup.sh`

Comprehensive cleanup script with detailed reporting. Good for regular maintenance.

**Run via SSH:**
```bash
ssh user@host 'bash -s' < .github/scripts/ec2-cleanup.sh
```

#### b) manual-ec2-cleanup.sh
**Location:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/.github/scripts/manual-ec2-cleanup.sh`

Aggressive emergency cleanup for critical situations (>90% disk usage).

**Run via SSH:**
```bash
ssh user@host 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
```

**Additional features:**
- More aggressive cleanup (1-day retention vs 7-day)
- Truncates PM2 logs instead of deleting
- Shows largest directories and files
- Warns if disk is still critically full after cleanup

#### c) README.md
**Location:** `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/.github/scripts/README.md`

Complete documentation including:
- How automatic cleanup works
- How to use manual scripts
- Emergency cleanup commands
- Long-term solutions
- Troubleshooting guide
- Monitoring recommendations

## Safety Measures

**What NEVER gets removed:**
- Current running application files
- Active node_modules directories
- Database files
- Configuration files (.env, ecosystem.config.js)
- SSH keys
- PM2 process files
- System critical files

**What gets removed:**
- Old deployment tar.gz files
- PM2 logs older than specified retention
- Package manager cache
- Unused Docker resources
- Old temporary files
- Yarn/npm cache
- Old system logs
- Backup directories (*.bak, *.old)

## Workflow Changes

### Before:
```yaml
- name: Verify deployment package
- name: Copy to EC2  # Could fail with "No space left on device"
- name: Deploy on EC2
```

### After:
```yaml
- name: Verify deployment package
- name: Cleanup EC2 disk space  # NEW - Frees up space first
- name: Copy to EC2             # Now has space available
- name: Deploy on EC2
```

## Testing the Fix

The next deployment will automatically run the cleanup step. You can verify it worked by:

1. Check GitHub Actions logs for "Cleanup EC2 disk space" step
2. Look for "BEFORE CLEANUP" and "AFTER CLEANUP" disk usage
3. Verify deployment completes successfully

## Next Steps

### Immediate Action Required
1. **Commit these changes** to fix future deployments:
   ```bash
   git add .github/workflows/deploy-api.yml
   git add .github/workflows/deploy-frontend.yml
   git add .github/scripts/
   git commit -m "fix: Add automatic disk cleanup to prevent deployment failures"
   git push
   ```

2. **Run manual cleanup NOW** to free space for the next deployment:
   ```bash
   ssh ubuntu@ec2-host 'bash -s' < .github/scripts/manual-ec2-cleanup.sh
   ```

### Long-term Recommendations

1. **Monitor Disk Usage:**
   - Set up CloudWatch alarm for disk usage > 80%
   - Add disk usage reporting to deployment logs

2. **Configure Log Rotation:**
   - Create `/etc/logrotate.d/pm2` on EC2
   - Rotate logs daily, keep 7 days

3. **Consider Infrastructure Changes:**
   - Increase EBS volume size if consistently hitting limits
   - Use separate volumes for application and logs
   - Archive old logs to S3

4. **Regular Maintenance:**
   - Run manual cleanup monthly
   - Review disk usage trends
   - Adjust retention policies as needed

## Files Changed

### Modified:
- `.github/workflows/deploy-api.yml` (added cleanup step before "Copy to EC2")
- `.github/workflows/deploy-frontend.yml` (added cleanup step before "Copy to EC2")

### Created:
- `.github/scripts/ec2-cleanup.sh` (comprehensive cleanup script)
- `.github/scripts/manual-ec2-cleanup.sh` (aggressive emergency cleanup)
- `.github/scripts/README.md` (complete documentation)
- `.github/scripts/DEPLOYMENT_FIX_SUMMARY.md` (this file)

## Impact

- **Zero downtime** - Cleanup runs before deployment
- **Automatic** - No manual intervention needed
- **Safe** - Only removes temporary/old files
- **Monitored** - Shows disk usage in logs
- **Preventive** - Runs on every deployment

This should completely resolve the "No space left on device" errors and prevent them from happening again.

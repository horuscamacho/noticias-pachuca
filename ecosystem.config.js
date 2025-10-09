module.exports = {
  apps: [
    {
      name: 'api-nueva',
      cwd: '/var/www/noticias-pachuca/packages/api-nueva',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        NODE_OPTIONS: '--max-old-space-size=350'
      },
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      merge_logs: true,
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000
    },
    {
      name: 'public-noticias',
      cwd: '/var/www/noticias-pachuca/packages/public-noticias',
      script: 'dist/server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=300'
      },
      error_file: '/var/log/pm2/frontend-error.log',
      out_file: '/var/log/pm2/frontend-out.log',
      merge_logs: true,
      max_memory_restart: '350M',
      autorestart: true,
      watch: false
    }
  ]
};

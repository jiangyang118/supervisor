module.exports = {
  apps: [
    {
      name: 'gateway-service',
      // Absolute or repo‑relative path to the compiled NestJS entry
      script: 'services/gateway-service/dist/src/main.js',
      cwd: __dirname,
      // Use all CPU cores and enable cluster mode for zero‑downtime reloads
      instances: 'max',
      exec_mode: 'cluster',
      // Robustness
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Logging (adjust if /var/log is not writable on your host)
      out_file: '/var/log/foodsafety/gateway.out.log',
      err_file: '/var/log/foodsafety/gateway.err.log',
      time: true,
      // Base environment — prefer using a .env file loaded by the app itself
      env: {
        NODE_ENV: 'production',
        PORT: '3300'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};


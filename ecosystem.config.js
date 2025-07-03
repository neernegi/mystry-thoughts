module.exports = {
  apps: [
    {
      name: 'next-app',
      script: './server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'socket-server',
      script: 'tsx',
      args: 'server.ts',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    }
  ]
};
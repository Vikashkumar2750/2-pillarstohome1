module.exports = {
  apps: [
    {
      name: "pillarstohome-app",
      script: "./dist-server/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

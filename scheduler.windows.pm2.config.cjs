module.exports = {
  apps: [
    {
      name: "Proxy",
      script: "yarn",
      args: "proxy",
      interpreter: "none",
      env: {
        NODE_ENV: "prodution",
        PROXY_TYPE: "request",
        DEBUG: false,
      },
    },
    {
      name: "Scheduler",
      script: "yarn",
      args: "scheduler:standalone",
      interpreter: "none",
      env: {
        NODE_ENV: "prodution",
        PROXY_TYPE: "request",
        DEBUG: false,
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "proxy",
      script: "yarn",
      args: "--cwd '/app' proxy",
      interpreter: "/bin/bash",
      env: {
        NODE_ENV: "production",
        PROXY_TYPE: "request",
        DEBUG: false,
      },
    },
    {
      name: "scheduler",
      script: "yarn",
      args: "--cwd '/app' scheduler:standalone",
      interpreter: "/bin/bash",
      env: {
        NODE_ENV: "production",
        PROXY_TYPE: "request",
        DEBUG: false,
      },
    },
  ],
};

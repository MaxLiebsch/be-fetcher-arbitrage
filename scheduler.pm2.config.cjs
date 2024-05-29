module.exports = {
  apps: [
    {
      name: `proxy_${process.env.NPM_PACKAGE_VERSION}`,
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
      name: `scheduler_${process.env.NPM_PACKAGE_VERSION}`,
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

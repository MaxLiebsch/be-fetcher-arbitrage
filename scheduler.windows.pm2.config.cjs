module.exports = {
  apps: [
    {
      name: `proxy_${process.env.NPM_PACKAGE_VERSION}`,
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
      name: `scheduler_${process.env.NPM_PACKAGE_VERSION}`,
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


const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `proxy_${version}`,
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
      name: `scheduler_${version}`,
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

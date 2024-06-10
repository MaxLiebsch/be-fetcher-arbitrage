
const version = process.env.APP_VERSION || require("./package.json").version;


module.exports = {
  apps: [
    {
      name: `proxy_${version}`,
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
      name: `scheduler_${version}`,
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

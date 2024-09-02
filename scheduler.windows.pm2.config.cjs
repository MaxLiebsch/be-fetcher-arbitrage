const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `proxy_${version}`,
      script: "yarn",
      args: "proxy",
      interpreter: "none",
      env: {
        NODE_ENV: "development",
        PROXY_TYPE: "mix",
        DEBUG: false,
      },
    },
    {
      name: `scheduler_${version}`,
      script: "yarn",
      args: "scheduler:standalone",
      interpreter: "development",
      env: {
        NODE_ENV: "prodution",
        DEBUG: false,
      },
    },
  ],
};

const version = process.env.APP_VERSION || require('./package.json').version;
const environment = 'development';
module.exports = {
  apps: [
    {
      name: `proxy_${version}`,
      script: 'yarn',
      args: "--cwd '/app' proxy",
      interpreter: '/bin/bash',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: environment,
        PROXY_TYPE: 'mix',
        DEBUG: false,
      },
    },
    {
      name: `scheduler_${version}`,
      script: 'yarn',
      args: "--cwd '/app' scheduler:standalone",
      interpreter: '/bin/bash',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        DEV_TOOLS: false,
        HEADLESS: true,
        REBROWSER_PATCHES_RUNTIME_FIX_MODE: 'addBinding',
        NODE_ENV: environment,
        DEBUG: false,
      },
    },
  ],
};

import { VersionProvider, Versions } from "@dipmaxtech/clr-pkg/lib/util/versionProvider";
import puppeteer, { Browser } from 'puppeteer-core';
import os from 'os';

export const mainBrowser = async (
  version: Versions,
  proxyAuth?: { host: string }
) => {
  const args = [
    '--no-sandbox',
    '--lang=de',
    '--disable-gpu',
    '--disable-webrtc',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--disable-extensions',
    '--disable-breakpad',
    '--safebrowsing-disable-auto-update',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-client-side-phishing-detection',
    '--metrics-recording-only',
    '--disable-hang-monitor',
    '--webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--force-webrtc-ip-handling-policy',
    '--start-maximized',
  ];

  if (proxyAuth) {
    const proxySetting = '--proxy-server=' + proxyAuth.host;
    args.push(proxySetting);
  }

  const provider = VersionProvider.getSingleton();
  provider.switchVersion(version);

  const options: any = {
    headless: process.env.HEADLESS === 'true' ? true : false,
    devtools: process.env.DEV_TOOLS === 'true' ? true : false,
    args,
    defaultViewport: null,
    timeout: 600000,
    protocolTimeout: 60000,
    ignoreDefaultArgs: ['--enable-automation'],
  };

  if (os.platform() === 'win32') {
    options['executablePath'] =
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (os.platform() === 'linux') {
    options['executablePath'] = '/usr/bin/google-chrome';
  }

  const browser = await puppeteer.launch(options);

  console.log('Browser Version: ', await browser.version());
  return browser;
};


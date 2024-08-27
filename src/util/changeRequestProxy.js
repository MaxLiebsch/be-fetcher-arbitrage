import { proxyAuth } from "../constants.js";

export async function changeRequestProxy(proxyType, link) {
  const host = new URL(link).hostname;
  await fetch(`http://${proxyAuth.host}/notify?proxy=${proxyType}&host=${host}`);
}

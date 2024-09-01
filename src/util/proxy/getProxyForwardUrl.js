export function getProxyForwardUrl(username, password, requestHost) {
  const proxyUrlStr = `http://${username}:${password}@${requestHost}`;

  const forwardProxyUrl = new URL(proxyUrlStr);

  const proxyAuth = Buffer.from(
    `${forwardProxyUrl.username}:${forwardProxyUrl.password}`
  ).toString("base64");

  return { forwardProxyUrl, proxyAuth };
}

export function generateProxyConnectRequest(targetHostPort, proxyAuth) {
  return [
    `CONNECT ${targetHostPort} HTTP/1.1`,
    `Host: ${targetHostPort}`,
    `Proxy-Authorization: Basic ${proxyAuth}`,
    "Connection: keep-alive",
    "",
    "",
  ].join("\r\n");
}

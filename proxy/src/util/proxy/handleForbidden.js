export function handleForbidden(clientSocket) {
  const responseMessage = "This domain is blocked.";
  const responseHeaders = [
    "HTTP/1.1 403 Forbidden",
    "Content-Type: text/plain",
    `Content-Length: ${Buffer.byteLength(responseMessage)}`,
    "Connection: close",
    "\r\n",
  ].join("\r\n");
  clientSocket.end(`${responseHeaders}${responseMessage}`);
}

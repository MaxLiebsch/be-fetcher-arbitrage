export function handleServerError(clientSocket) {
  const responseMessage = "Internal Server Error.";
  const responseHeaders = [
    "HTTP/1.1 500 Internal Server Error",
    "Content-Type: text/plain",
    `Content-Length: ${Buffer.byteLength(responseMessage)}`,
    "Connection: close",
    "\r\n",
  ].join("\r\n");
  clientSocket.end(`${responseHeaders}${responseMessage}`);
}

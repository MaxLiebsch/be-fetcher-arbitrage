export function handleClientsocketError(clientSocket, err) {
  // @ts-ignore
  if (err.code === "EPIPE") {
    console.error("EPIPE error: attempted to write to a closed socket");
    clientSocket.end();
    // @ts-ignore
  } else if (err.code === "ECONNABORTED") {
    console.error("ECONNABORTED error: connection aborted");
    clientSocket.end();
    // @ts-ignore
  } else if (err.code === "ECONNRESET") {
    console.error("ECONNRESET error: connection reset by peer");
    clientSocket.end();
  } else {
    console.error("Socket error:", err);
    clientSocket.end();
  }
}

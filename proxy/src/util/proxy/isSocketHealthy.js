export function isSocketHealthy(socket) {
  return (
    !socket.destroyed &&
    socket.readable &&
    socket.writable &&
    socket.remoteAddress !== undefined &&
    socket.remotePort !== undefined
  );
}

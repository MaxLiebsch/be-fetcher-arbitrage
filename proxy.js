import http from "http";
import net from "net";

import "dotenv/config";
import { config } from "dotenv";
import allowed from "./static/allowed.js";

config({
  path: [`.env.${process.env.NODE_ENV}.${process.env.PROXY_TYPE}`],
});

const username = process.env.PROXY_USERNAME;
const password = process.env.PROXY_PASSWORD;

let currProxyIdx = 0;
let retries = 0;

const proxyHosts = Object.entries(process.env).reduce((acc, [key, host]) => {
  if (key.trim().startsWith("PROXY_HOST_")) {
    acc.push(`http://${username}:${password}@${host}`);
  }
  return acc;
}, []);

const numberOfProxies = proxyHosts.length;

const nextProxyUrlStr = () => {
  if (numberOfProxies === 1) {
    return proxyHosts[0];
  }
  if (currProxyIdx === numberOfProxies - 1) {
    currProxyIdx = 0;
    return proxyHosts[currProxyIdx];
  } else if (currProxyIdx === 0) {
    currProxyIdx += 1;
    return proxyHosts[0];
  } else {
    const curr = currProxyIdx;
    currProxyIdx += 1;
    return proxyHosts[curr];
  }
};

// Create your custom server and define the logic
const server = http.createServer();

const establishedConnections = {};

server.on("connect", (req, clientSocket, head) => {
  const { hostname, port } = new URL(`http://${req.url}`);

  if (!allowed.some((domain) => hostname.includes(domain))) {
    const responseMessage = "This domain is blocked.";
    const responseHeaders = [
      "HTTP/1.1 403 Forbidden",
      "Content-Type: text/plain",
      `Content-Length: ${Buffer.byteLength(responseMessage)}`,
      "Connection: close",
      "\r\n",
    ].join("\r\n");
    clientSocket.end(`${responseHeaders}${responseMessage}`);
    return;
  }

  const targetHostPort = `${hostname}:${port}`;

  const proxyUrlStr = nextProxyUrlStr();
  const forwardProxyUrl = new URL(proxyUrlStr);
  const proxyAuth = Buffer.from(
    `${forwardProxyUrl.username}:${forwardProxyUrl.password}`
  ).toString("base64");

  const proxyConnectRequest = [
    `CONNECT ${targetHostPort} HTTP/1.1`,
    `Host: ${targetHostPort}`,
    `Proxy-Authorization: Basic ${proxyAuth}`,
    "Connection: Keep-Alive",
    "Keep-Alive: timeout=20, max=1000",
    "",
    "",
  ].join("\r\n");

  console.log(`Establishing new connection to ${targetHostPort}`);
  // Establish a new connection
  establishedConnection(
    clientSocket,
    forwardProxyUrl,
    targetHostPort,
    proxyConnectRequest,
    head
  );

  clientSocket.on("close", () => {
    console.log("clientsocket close");
  });

  clientSocket.on("error", (err) => {
    console.log("ClientSocket", err);
  });
});

console.log("Listening on port 8080");
server.listen(8080);

server.on("error", (err) => {
  console.log("Proxy Server error", err);
});

const establishedConnection = (
  clientSocket,
  forwardProxyUrl,
  targetHostPort,
  proxyConnectRequest,
  head
) => {
  const proxySocket = net.connect(
    forwardProxyUrl.port,
    forwardProxyUrl.hostname
  );

  proxySocket.once("connect", () => {
    // Send the CONNECT request with Basic Auth to the forward proxy
    proxySocket.write(proxyConnectRequest);

    // Wait for the proxy's response
    proxySocket.once("data", (chunk) => {
      const chunkStr = chunk.toString();
      // Assuming the proxy responds with a 200 connection established
      if (
        chunkStr.toLowerCase().includes("connection established") ||
        chunkStr.toLowerCase().includes("ok") ||
        chunkStr.toLowerCase().includes("200")
      ) {
        console.log("CONNECTED:", targetHostPort);
        clientSocket.write(
          "HTTP/1.1 200 Connection Established\r\nProxy-agent: Genius Proxy\r\n\r\n"
        );
        proxySocket.write(head);
        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);
        // establishedConnections[targetHostPort].connected = true;
      } else {
        console.log("WELL", chunkStr);
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
    });
  });

  proxySocket.setTimeout(60000);

  proxySocket.on("close", () => {
    delete establishedConnections[targetHostPort];
    console.log("proxySocket closed");
  });

  proxySocket.on("drain", () => {
    console.log("proxySocket drain");
  });

  proxySocket.on("timeout", () => {
    delete establishedConnections[targetHostPort];
    console.log("proxySocket timeout");
  });

  proxySocket.on("error", (err) => {
    console.error("Proxy socket error:", err);
    delete establishedConnections[targetHostPort];
    const responseMessage = "Internal Proxy Server Error.";
    const responseHeaders = [
      "HTTP/1.1 500 Internal Server Error",
      "Content-Type: text/plain",
      `Content-Length: ${Buffer.byteLength(responseMessage)}`,
      "Connection: close",
      "\r\n",
    ].join("\r\n");
    clientSocket.end(`${responseHeaders}${responseMessage}`);
  });
};

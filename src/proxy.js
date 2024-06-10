import http from "http";
import url from "url";
import net from "net";

import "dotenv/config";
import { config } from "dotenv";

import os from "os";
import { allowed } from "@dipmaxtech/clr-pkg";

const osHostname = os.hostname();

config({
  path: [
    `.env.${process.env.NODE_ENV}.${process.env.PROXY_TYPE}`,
    `.env.${process.env.NODE_ENV}`,
  ],
});

const username = process.env.BASIC_AUTH_USERNAME;
const password = process.env.BASIC_AUTH_PASSWORD;
let host = process.env.PROXY_GATEWAY_URL; // Default proxy request
const PORT = 8080;

// Create your custom server and define the logic
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === "GET" && parsedUrl.pathname === "/change-proxy") {
    const query = parsedUrl.query;

    if (!query.proxy) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad Request");
    }
    if (query.proxy === "gb") {
      host = process.env.PROXY_GATEWAY_URL_GB;
    } else if (query.proxy === "request") {
      host = process.env.PROXY_GATEWAY_URL;
    }
    // Set the response HTTP headers
    res.writeHead(200, { "Content-Type": "application/json" });
    // Send the health check response
    res.end(JSON.stringify({ status: "ok", proxy: query.proxy }));
  } else {
    // Handle other requests with a 404 Not Found response
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.on("connect", (req, clientSocket, head) => {
  const { hostname, port } = new URL(`http://${req.url}`);

  if (!allowed.some((domain) => hostname.includes(domain))) {
    const responseMessage = "This domain is blocked.";
    const responseHeaders = [
      "HTTP/1.1 403 Forbidden",
      "Content-Type: text/plain",
      `Content-Length: ${Buffer.byteLength(responseMessage)}`,
      // `Crawler: ${osHostname}`,
      "Connection: close",
      "\r\n",
    ].join("\r\n");
    clientSocket.end(`${responseHeaders}${responseMessage}`);
    return;
  }

  const targetHostPort = `${hostname}:${port}`;
  const proxyUrlStr = `http://${username}:${password}@${host}`;
  const forwardProxyUrl = new URL(proxyUrlStr);

  const proxyAuth = Buffer.from(
    `${forwardProxyUrl.username}:${forwardProxyUrl.password}`
  ).toString("base64");

  const proxyConnectRequest = [
    `CONNECT ${targetHostPort} HTTP/1.1`,
    `Host: ${targetHostPort}`,
    `Proxy-Authorization: Basic ${proxyAuth}`,
    "Connection: keep-alive",
    "",
    "",
  ].join("\r\n");

  establishedConnection(
    clientSocket,
    forwardProxyUrl,
    targetHostPort,
    proxyConnectRequest,
    head
  );

  clientSocket.on("error", (err) => {
    if (err.code === "EPIPE") {
      console.error("EPIPE error: attempted to write to a closed socket");
      clientSocket.end();
    } else if (err.code === "ECONNABORTED") {
      console.error("ECONNABORTED error: connection aborted");
      clientSocket.end();
    } else if (err.code === "ECONNRESET") {
      console.error("ECONNRESET error: connection reset by peer");
      clientSocket.end();
    } else {
      console.error("Socket error:", err);
      clientSocket.end();
    }
  });
});

console.log("Listening on port 8080");
server.listen(PORT);

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
        clientSocket.write(
          "HTTP/1.1 200 Connection Established\r\nProxy-agent: Genius Proxy\r\n\r\n"
        );
        proxySocket.write(head);
        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);
      } else {
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

  proxySocket.on("error", (err) => {
    console.log('err:', err)
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

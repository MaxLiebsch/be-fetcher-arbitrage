import http from "http";
import net from "net";
import request from "request";
import blocked from "./static/blocked.js";

import "dotenv/config";
import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV}.${process.env.PROXY_TYPE}` });

const username = process.env.PROXY_USERNAME;
const password = process.env.PROXY_PASSWORD;
const host = process.env.PROXY_HOST;

// Define your forward proxy settings
const FORWARD_PROXY_URL = `http://${username}:${password}@${host}`;

// Create your custom server and define the logic
const server = http.createServer((req, res) => {
  const hostname = req.headers.host;
  console.log("hostname:", hostname);
  // Check if the domain is blocked
  if (blocked.some((domain) => hostname.includes(domain))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("This domain is blocked.");
    return;
  }

  // Forward the request to the specified forward proxy
  req.pipe(request({ url: req.url, proxy: FORWARD_PROXY_URL })).pipe(res);
});

server.on("request", (req, res) => {
  const hostname = req.headers.host;
  console.log("request", hostname);
  // Check if the domain is blocked
  if (blocked.some((domain) => hostname.includes(domain))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("This domain is blocked.");
    return;
  }

  // Forward the request to the specified forward proxy
  req.pipe(request({ url: req.url, proxy: FORWARD_PROXY_URL })).pipe(res);
});

server.on("connect", (req, clientSocket, head) => {
  const { hostname, port } = new URL(`http://${req.url}`);

  if (blocked.some((domain) => hostname.includes(domain))) {
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
  const forwardProxyUrl = new URL(FORWARD_PROXY_URL);

  const proxyAuth = Buffer.from(
    `${forwardProxyUrl.username}:${forwardProxyUrl.password}`
  ).toString("base64");

  const proxyConnectRequest = [
    `CONNECT ${hostname}:${port} HTTP/1.1`,
    `Host: ${hostname}:${port}`,
    `Proxy-Authorization: Basic ${proxyAuth}`,
    "",
    "",
  ].join("\r\n");

  const proxySocket = net.connect(
    forwardProxyUrl.port,
    forwardProxyUrl.hostname,
    () => {
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
          console.log("CONNECTED:", hostname);
          clientSocket.write(
            "HTTP/1.1 200 Connection Established\r\nProxy-agent: Genius Proxy\r\n\r\n"
          );
          proxySocket.write(head);
          proxySocket.pipe(clientSocket);
          clientSocket.pipe(proxySocket);
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
          proxySocket.end();
        }
      });
    }
  );
  proxySocket.setTimeout(15000);

  proxySocket.on("lookup", (err, address, family, host) => {
    if (process.env.DEBUG) {
      console.log("err,address, family, host:", err, address, family, host);
    }
  });

  proxySocket.on("close", () => {
    console.log("proxySocket closed");
  });

  proxySocket.on("ready", () => {
    console.log("proxySocket ready");
  });

  proxySocket.on("drain", () => {
    console.log("proxySocket drain");
  });

  proxySocket.on("timeout", () => {
    proxySocket.end();
    console.log("proxySocket timeout");
  });

  proxySocket.on("error", (err) => {
    console.error("Proxy socket error:", err);
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

  clientSocket.on("close", () => {
    console.log("clientsocket close");
  });

  clientSocket.on("error", (err) => {
    console.log("ClientSocket", err);
    proxySocket.end();
  });
});

console.log("Listening on port 8080");
server.listen(8080);

server.on("error", (err) => {
  console.log("Proxy Server error", err);
});

import http from "http";
import net from "net";
import httpProxy from "http-proxy";
import request from "request";
import blocked from "./static/blocked.js";

import "dotenv/config";
import {config} from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV}.${process.env.PROXY_TYPE}` });

const username = process.env.PROXY_USERNAME;
const password = process.env.PROXY_PASSWORD;
const host = process.env.PROXY_HOST;

// Define your forward proxy settings
const FORWARD_PROXY_URL = `http://${username}:${password}@${host}`;

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({});

// Create your custom server and define the logic
const server = http.createServer((req, res) => {
  const hostname = req.headers.host;
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
    clientSocket.end("HTTP/1.1 403 This domain is blocked.\r\n");
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
        // Assuming the proxy responds with a 200 connection established
        if (
          chunk.toString().indexOf("HTTP/1.1 200 Connection established") > -1
        ) {
          console.log("CONNECTED:", hostname, port, req.method, req.url);
          clientSocket.write(
            "HTTP/1.1 200 Connection Established\r\nProxy-agent: Node.js-Proxy\r\n\r\n"
          );
          proxySocket.write(head);
          proxySocket.pipe(clientSocket);
          clientSocket.pipe(proxySocket);
        } else {
          // Handle non-200 responses
          clientSocket.end("HTTP/1.1 500 Internal Server Error\r\n");
          proxySocket.end();
        }
      });
    }
  );

  proxySocket.on("error", (err) => {
    console.error("Proxy socket error:", err);
    clientSocket.end("HTTP/1.1 500 Internal Server Error\r\n");
  });

  clientSocket.on("error", (err) => {
    console.log("err:", err);
  });
});

console.log("Listening on port 8080");
server.listen(8080);

// Error handling for the proxy server
proxy.on("error", function (err, req, res) {
  console.log("err:", err);
  res.writeHead(500, {
    "Content-Type": "text/plain",
  });

  res.end("Something went wrong. And we are reporting a custom error message.");
});

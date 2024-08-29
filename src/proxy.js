import http from "http";
import url from "url";
import net from "net";
import "dotenv/config";
import { config } from "dotenv";

import { allowed } from "@dipmaxtech/clr-pkg";
import UpcomingRequestCache from "./util/UpcomingRequestCache.js";

config({
  path: [`.env.${process.env.NODE_ENV}`],
});

const username = process.env.BASIC_AUTH_USERNAME;
const password = process.env.BASIC_AUTH_PASSWORD;
let host = process.env.PROXY_GATEWAY_URL; // Default proxy request
const PORT = 8080;

const hosts = {
  de: process.env.PROXY_GATEWAY_URL_DE || "",
  mix: process.env.PROXY_GATEWAY_URL || "",
};

const upcomingRequest = new UpcomingRequestCache();

function handleErrors(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  return res.end(message);
}
function handleSuccess(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ status: "ok", message }));
}

// Create your custom server and define the logic
const server = http.createServer((req, res) => {
  if (!req.url) return;
  const parsedUrl = url.parse(req.url, true);
  if (req.method === "GET" && parsedUrl.pathname === "/change-proxy") {
    const query = parsedUrl.query;

    if (!query.proxy) {
      handleErrors(res, 400, "Bad Request");
    }
    if (query.proxy === "de") {
      host = process.env.PROXY_GATEWAY_URL_DE;
    } else if (query.proxy === "mix") {
      host = process.env.PROXY_GATEWAY_URL;
    }
    handleSuccess(res, 200, `Proxy changed to ${query.proxy}`);
  } else if (req.method === "GET" && parsedUrl.pathname === "/notify") {
    const query = parsedUrl.query;
    if (!query) {
      handleErrors(res, 400, "Bad Request");
    }
    const { proxy, host, cnt } = query;
    switch (true) {
      case proxy === "de":
        upcomingRequest.set(host, hosts.de, Number(cnt));
        break;
      case proxy === "mix":
        upcomingRequest.set(host, hosts.mix);
        break;
    }
    handleSuccess(res, 200, `Request proxy changed to ${query.proxy}`);
  } else {
    // Handle other requests with a 404 Not Found response
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.on("connect", (req, clientSocket, head) => {
  const { hostname, port } = new URL(`http://${req.url}`);

  if (!allowed.some((domain) => hostname.includes(domain))) {
    upcomingRequest.kill(hostname);
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
  const requestHost = upcomingRequest.get(hostname) || host;
  console.log(hostname, "requestHost:", requestHost);

  const proxyUrlStr = `http://${username}:${password}@${requestHost}`;

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
    console.log("err:", err);
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

process.on("uncaughtException", function (err) {
  console.log("Proxy Server uncaught Error", err.stack);
});

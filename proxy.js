import http from "http";
import net from "net";
import blocked from "./static/blocked.js";

import "dotenv/config";
import { config } from "dotenv";

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
  if(numberOfProxies === 1){
    return proxyHosts[0]
  }
  if (currProxyIdx === numberOfProxies - 1) {
    currProxyIdx = 0;
    return proxyHosts[currProxyIdx];
  } else {
    currProxyIdx += 1;
    return proxyHosts[currProxyIdx];
  }
};

// Create your custom server and define the logic
const server = http.createServer();

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
  const proxyUrlStr = nextProxyUrlStr()
  const forwardProxyUrl = new URL(proxyUrlStr);
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
    if(err.message.includes('ECONNRESET')){
       retries += 1;
    }
    if(retries >= 30){
      throw new Error(`Proxies connection failed for ${retries}`)
    }
    proxySocket.end();
  });
});

console.log("Listening on port 8080");
server.listen(8080);

server.on("error", (err) => {
  console.log("Proxy Server error", err);
});

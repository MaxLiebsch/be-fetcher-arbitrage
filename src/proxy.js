import http from "http";
import url from "url";
import net from "net";
import "dotenv/config";
import { config } from "dotenv";
import { allowed, uuid } from "@dipmaxtech/clr-pkg";
import { getProxyForwardUrl } from "./util/proxy/getProxyForwardUrl.js";
import { generateProxyConnectRequest } from "./util/proxy/generateProxyConnectRequest.js";
import { handleForbidden } from "./util/proxy/handleForbidden.js";
import { handleClientsocketError } from "./util/proxy/handleClientsocketError.js";
import { handleServerError } from "./util/proxy/handleServerError.js";
import UpcomingRequestCachev2 from "./util/UpcomingRequestCachev2.js";
import {
  handleCompleted,
  handleNotify,
  handleProxyChange,
  handleRegister,
  handleTerminationPrevConnections,
} from "./util/proxy/proxyServices.js";

config({
  path: [`.env.${process.env.NODE_ENV}`],
});

const status = [
  "connection established",
  "ok",
  "200",
  "200 connection established",
];
const proxyConnectedStr =
  "HTTP/1.1 200 Connection Established\r\nProxy-agent: Genius Proxy\r\n\r\n";

const username = process.env.BASIC_AUTH_USERNAME;
const password = process.env.BASIC_AUTH_PASSWORD;
let host = process.env.PROXY_GATEWAY_URL; // Default proxy request
let de_host = process.env.PROXY_GATEWAY_URL_DE; // Default de proxy request
const PORT = 8080;

const proxies = {
  de: '89.58.0.149:8082',
  mix: host,
};

console.log('Initial Proxies:', proxies, de_host)

const getType = (proxy) => {
  return Object.keys(proxies).find((key) => proxies[key] === proxy);
};

const upReqv2 = new UpcomingRequestCachev2();

const server = http.createServer((req, res) => {
  if (!req.url) return;
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const { method } = req;
  if (method === "GET") {
    switch (pathname) {
      case "/change-proxy":
        host = handleProxyChange(query, res);
        break;
      case "/notify": 
        handleNotify(upReqv2, query, res, proxies);
        break;
      case "/terminate-prev-connections":
        handleTerminationPrevConnections(upReqv2, query, res);
        break;
      case "/register":
        handleRegister(upReqv2, query, res);
        break;
      case "/completed":
        handleCompleted(upReqv2, query, res);
        break;

      default:
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        break;
    }
  }
});

server.on("connect", (req, clientSocket, head) => {
  const { hostname, port } = new URL(`http://${req.url}`);
  if (!allowed.some((domain) => hostname.includes(domain))) {
    upReqv2.kill(hostname);
    handleForbidden(clientSocket);
    return;
  }
  const socketId = uuid();
  //@ts-ignore
  clientSocket.id = socketId;

  const targetHostPort = `${hostname}:${port}`;
  let requestId = upReqv2.getRequestId(hostname);
  const requestHost = upReqv2.getProxyUrl(requestId) || host;
  const proxyType = getType(requestHost);
  upReqv2.setSocket(requestId, hostname, proxyType, clientSocket);
  console.log("Host: ", hostname, " Id: ", requestId, "Proxy: ", requestHost);
  const { forwardProxyUrl, proxyAuth } = getProxyForwardUrl(
    username,
    password,
    requestHost
  );
  const proxyConnectRequest = generateProxyConnectRequest(
    targetHostPort,
    proxyAuth
  );

  establishedConnection(
    clientSocket,
    forwardProxyUrl,
    proxyConnectRequest,
    head,
    hostname,
    requestId,
    requestHost
  );

  clientSocket.on("close", () => {
    upReqv2.removeSocket(socketId);
  });

  clientSocket.on("error", (err) => {
    upReqv2.removeSocket(socketId);
    handleClientsocketError(clientSocket, err);
  });
});

console.log("Listening on port " + PORT);
server.listen(PORT);

server.on("error", (err) => {
  console.log("Proxy Server error", err);
});

const establishedConnection = (
  clientSocket,
  forwardProxyUrl,
  proxyConnectRequest,
  head,
  hostname,
  requestId,
  requestHost
) => {
  const proxySocket = net.connect(
    forwardProxyUrl.port,
    forwardProxyUrl.hostname
  );
  const proxySocketId = uuid();
  //@ts-ignore
  proxySocket.id = proxySocketId;

  proxySocket.once("connect", () => {
    proxySocket.write(proxyConnectRequest);

    proxySocket.once("data", (chunk) => {
      const chunkStr = chunk.toString().toLowerCase();
      if (status.some((s) => chunkStr.includes(s))) {
        clientSocket.write(proxyConnectedStr);
        proxySocket.write(head);
        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);
        upReqv2.setSocket(
          requestId,
          hostname,
          getType(requestHost),
          proxySocket
        );
      } else {
        upReqv2.removeSocket(clientSocket.id);
        handleServerError(clientSocket);
      }
    });
  });

  proxySocket.on("close", () => {
    upReqv2.removeSocket(proxySocketId);
  });

  proxySocket.on("error", (err) => {
    handleServerError(clientSocket);
    upReqv2.removeSocket(proxySocketId);
  });
};

process.on("uncaughtException", function (err) {
  console.log("Proxy Server uncaught Error", err.stack);
});

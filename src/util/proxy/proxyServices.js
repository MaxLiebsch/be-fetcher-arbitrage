import "dotenv/config";
import { config } from "dotenv";

config({
  path: [`.env.${process.env.NODE_ENV}`],
});

let mix_host = process.env.PROXY_GATEWAY_URL; // Default proxy request
let de_host = process.env.PROXY_GATEWAY_URL_DE; // Default de proxy request

const proxies = {
  de: "89.58.0.149:8082",
  mix: "89.58.0.149:8081",
};

function handleErrors(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  return res.end(message);
}
function handleSuccess(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  return res.end(message);
}
function handleBadRequest(res, message) {
  handleErrors(res, 400, message);
}

export function handleProxyChange(query, res) {
  if (query.proxy === "de") {
    return de_host;
  }
  handleSuccess(res, 200, `Proxy changed to ${query.proxy}`);
  return mix_host;
}

export function handleNotify(upReqv2, query, res) {
  if (!query) {
    return handleBadRequest(res, "Bad Request");
  }
  const { de, mix } = proxies;
  const { proxy, host, hosts, requestId, time } = query;
  const parsedTime = Number(time);
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  switch (true) {
    case proxy === "de":
      upReqv2.setProxy(requestId, host, parsedHosts, de, parsedTime);
      break;
    default:
      upReqv2.setProxy(requestId, host, parsedHosts, mix, parsedTime);
      break;
  }
  handleSuccess(res, 200, `Proxy changed to ${proxy} for ${requestId}`);
}

export function handleTerminationPrevConnections(upReqv2, query, res) {
  const { requestId, host, hosts, prevProxyType } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  upReqv2.terminatePrevConnections(requestId, host, parsedHosts, prevProxyType);
  handleSuccess(res, 200, `Request ${requestId} proxy terminated`);
}

export function connectionHealth(upReqv2, query, res) {
  const { host, hosts, requestId } = query;
  if (!host) {
    return handleBadRequest(res, "Bad Request");
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  const health = upReqv2.connectionHealth(requestId, host, parsedHosts);
  return handleSuccess(res, 200, health);
}

export function handleRegister(upReqv2, query, res) {
  const { requestId, time, host, hosts } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  const parsedTime = Number(time);

  if (upReqv2.has(requestId)) {
    return handleSuccess(res, 200, `${requestId} Request already registered`);
  }

  upReqv2.register(requestId, host, parsedHosts, parsedTime);
  handleSuccess(res, 200, `Request registered ` + requestId);
}

export function handleCompleted(upReqv2, query, res) {
  const { requestId } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  upReqv2.kill(requestId);
  handleSuccess(res, 200, `Request completed`);
}

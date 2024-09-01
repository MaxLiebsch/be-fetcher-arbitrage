function handleErrors(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  return res.end(message);
}
function handleSuccess(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ status: "ok", message }));
}
function handleBadRequest(res, message) {
  handleErrors(res, 400, message);
}

export function handleProxyChange(query, res) {
  if (query.proxy === "de") {
    return process.env.PROXY_GATEWAY_URL_DE;
  }
  handleSuccess(res, 200, `Proxy changed to ${query.proxy}`);
  return process.env.PROXY_GATEWAY_URL;
}

export function handleNotify(upReqv2, query, res, proxies) {
  if (!query) {
    return handleBadRequest(res, "Bad Request");
  }
  const { de, mix } = proxies;
  const { proxy, host, cnt, hosts, requestId, time } = query;
  const parsedTime = Number(time);
  const parsedCnt = Number(cnt);
  const parsedHosts = JSON.parse(decodeURIComponent(hosts))
  switch (true) {
    case proxy === "de":
      upReqv2.setProxy(requestId, host, parsedHosts, de, parsedTime, parsedCnt);
      break;
    default:
      upReqv2.setProxy(requestId, host, parsedHosts,mix, parsedTime, parsedCnt);
      break;
  }
  handleSuccess(res, 200, `Request proxy changed to ${proxy}`);
}

export function handleTerminate(upReqv2, query, res) {
  const { requestId } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  console.log(`Terminating connections for ${requestId}`);
  upReqv2.terminateConnections(requestId);
  handleSuccess(res, 200, `Request ${requestId} proxy terminated`);
}

export function handleRegister(upReqv2, query, res) {
  const { requestId, time, host, hosts } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts))
  const parsedTime = Number(time);
  upReqv2.register(requestId, host, parsedHosts, parsedTime);
  handleSuccess(res, 200, `Request registered`);
}

export function handleCompleted(upReqv2, query, res) {
  const { requestId } = query;
  if (!requestId) {
    return handleBadRequest(res, "Bad Request");
  }
  upReqv2.kill(requestId);
  handleSuccess(res, 200, `Request completed`);
}

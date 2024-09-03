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
  console.log(":Proxies in handle Notify ", proxies);
  console.log("DE_PROXY:", process.env.PROXY_GATEWAY_URL_DE);
  const { proxy, host, hosts, requestId, time } = query;
  const parsedTime = Number(time);
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  switch (true) {
    case proxy === "de":
      console.log("DE Proxy Selected", de);
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

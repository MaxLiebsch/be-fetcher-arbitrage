import { ServerResponse } from 'http';
import 'dotenv/config';
import { config } from 'dotenv';
import UpcomingRequestCachev2 from '../UpcomingRequestCachev2';
import { Proxies, ProxyServiceSearchQuery } from '../../types/proxy';
import { ProxyType } from '@dipmaxtech/clr-pkg';
import path from 'path';

config({
  path: [path.resolve(__dirname, `../../../.env.${process.env.NODE_ENV}`)],
});

const mix_host = process.env.PROXY_GATEWAY_URL!; // Default proxy request
const de_host = process.env.PROXY_GATEWAY_URL_DE!; // Default de proxy request
const des_host = process.env.PROXY_GATEWAY_URL_DES!; // Default dep proxy request

const proxies: Proxies = {
  des: '89.58.0.149:8083',
  de: de_host,
  mix: mix_host,
};

console.log('des_host:', des_host);
console.log('proxies:', JSON.stringify(proxies, null, 2));

function handleErrors(
  res: ServerResponse,
  statusCode: number,
  message: string
) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  return res.end(message);
}

function handleSuccess(
  res: ServerResponse,
  statusCode: number,
  message: string
) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  return res.end(message);
}
function handleBadRequest(res: ServerResponse, message: string) {
  handleErrors(res, 400, message);
}

export function handleProxyChange(
  query: { proxy: ProxyType },
  res: ServerResponse
) {
  const { de, mix, des } = proxies;
  handleSuccess(res, 200, `Proxy changed to ${query.proxy}`);
  if (query.proxy === 'de') {
    return de;
  }
  if (query.proxy === 'des') {
    return des;
  }
  return mix;
}

export function handleNotify(
  upReqv2: UpcomingRequestCachev2,
  query: ProxyServiceSearchQuery,
  res: ServerResponse
) {
  if (!query) {
    return handleBadRequest(res, 'Bad Request');
  }
  const { de, mix, des } = proxies;
  const { proxy, host, hosts, requestId, time } = query;
  const parsedTime = Number(time);
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  switch (true) {
    case proxy === 'de':
      upReqv2.setProxy(requestId, host, parsedHosts, de, parsedTime);
      break;
    case proxy === 'des':
      upReqv2.setProxy(requestId, host, parsedHosts, des, parsedTime);
      break;
    default:
      upReqv2.setProxy(requestId, host, parsedHosts, mix, parsedTime);
      break;
  }
  handleSuccess(res, 200, `Proxy changed to ${proxy} for ${requestId}`);
}

export function handleTerminationPrevConnections(
  upReqv2: UpcomingRequestCachev2,
  query: ProxyServiceSearchQuery,
  res: ServerResponse
) {
  const { requestId, host, hosts, prevProxyType } = query;
  if (!requestId) {
    return handleBadRequest(res, 'Bad Request');
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  upReqv2.terminatePrevConnections(requestId, host, parsedHosts, prevProxyType);
  handleSuccess(res, 200, `Request ${requestId} proxy terminated`);
}

export function connectionHealth(
  upReqv2: UpcomingRequestCachev2,
  query: ProxyServiceSearchQuery,
  res: ServerResponse
) {
  const { host, hosts, requestId } = query;
  if (!host) {
    return handleBadRequest(res, 'Bad Request');
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  const health = upReqv2.connectionHealth(requestId, host, parsedHosts);
  return handleSuccess(res, 200, health);
}

export function handleRegister(
  upReqv2: UpcomingRequestCachev2,
  query: ProxyServiceSearchQuery,
  res: ServerResponse
) {
  const { requestId, time, host, hosts } = query;
  if (!requestId) {
    return handleBadRequest(res, 'Bad Request');
  }
  const parsedHosts = JSON.parse(decodeURIComponent(hosts));
  const parsedTime = Number(time);

  if (upReqv2.has(requestId)) {
    return handleSuccess(res, 200, `${requestId} Request already registered`);
  }

  upReqv2.register(requestId, host, parsedHosts, parsedTime);
  handleSuccess(res, 200, `Request registered ` + requestId);
}

export function handleCompleted(
  upReqv2: UpcomingRequestCachev2,
  query: ProxyServiceSearchQuery,
  res: ServerResponse
) {
  const { requestId } = query;
  if (!requestId) {
    return handleBadRequest(res, 'Bad Request');
  }
  upReqv2.kill(requestId);
  handleSuccess(res, 200, `Request completed`);
}

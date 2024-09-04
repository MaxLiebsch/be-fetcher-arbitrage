import { LRUCache } from "lru-cache";
import { TTL_UPCOMING_REQUEST } from "../constants.js";
import { is } from "date-fns/locale";
import { isSocketHealthy } from "./proxy/isSocketHealthy.js";

// const upcomingRequest = [
//   [{ requestId: { proxy: null, hosts: { host1: { sockets: [] } } } }],
// ];

/*
     sockets: [
        {
          ...socket,
          id: socketId,
          proxyType: proxyType,
          host: host,
          requestIds: [requestId], 
       }
     ]

*/

class UpcomingRequestCachev2 {
  constructor() {
    const options = {
      max: 3200,
      ttl: TTL_UPCOMING_REQUEST,
      ttlAutopurge: true,
    };
    this.cache = new LRUCache(options);
    this.sockets = new Map(); // Sockets 'host1-de => [socket1, socket2]'
  }

  has(requestId) {
    return this.cache.has(requestId);
  }

  getRequestId(host) {
    let closestTimeDiff = Infinity;
    let closestRequestId = null;
    const now = Date.now();
    for (let [requestId, request] of this.cache) {
      if (request.hosts[host]) {
        const { time } = request;
        const timeDiff = Math.abs(now - time);
        if (timeDiff < closestTimeDiff) {
          closestTimeDiff = timeDiff;
          closestRequestId = requestId;
        }
      } else {
        continue;
      }
    }
    if (closestRequestId) {
      return closestRequestId;
    } else {
      return null;
    }
  }

  getHostProxy(host, proxyType) {
    return `${host}-${proxyType}`;
  }

  terminatePrevConnections(requestId, host, hosts, prevProxyType) {
    hosts.push(host);
    hosts.forEach((host) => {
      const key = this.getHostProxy(host, prevProxyType);
      const sockets = this.sockets.get(key);
      if (sockets) { 
        sockets.forEach((socket) => {
          try {
            socket.end();
          } catch (error) {
            console.error(`Failed to terminate connection for ${host}:`, error);
          }
        });
        this.sockets.delete(key);
      }
    });
  }

  register(requestId, host, hosts, time) {
    let request = this.cache.get(requestId);
    if (!request) {
      const request = {
        proxy: null,
        hosts: { [host]: { sockets: [] } },
        time,
      };
      if (hosts.length > 0) {
        hosts.forEach((host) => {
          if (!request.hosts[host]) {
            request.hosts[host] = { sockets: [] };
          }
        });
      }
      this.cache.set(requestId, request);
    }
  }

  removeSocket(socketId) {
    for (let [key, sockets] of this.sockets) {
      const index = sockets.findIndex((socket) => socket.id === socketId);
      if (index !== -1) {
        sockets.splice(index, 1);
        this.sockets.set(key, sockets);
      }
    }
  }

  endSocket(socketId) {
    for (let [key, sockets] of this.sockets) {
      const index = sockets.findIndex((socket) => socket.id === socketId);
      if (index !== -1) {
        try {
          sockets[index].end();
          sockets.splice(index, 1);
          this.sockets.set(key, sockets);
        } catch (error) {
          console.error("Failed to destroy socket", error);
        }
      }
    }
  }

  connectionHealth(requestId, host, proxyType) {
    const key = this.getHostProxy(host, proxyType);
    const sockets = this.sockets.get(key);
    if (sockets) {
      const checkHealth = sockets.some((socket) => {
        return !isSocketHealthy(socket);
      });
      if (checkHealth) {
        return "sockets-not-healthy";
      }
      return "sockets-healthy";
    } else {
      return "no-sockets-found";
    }
  }

  setSocket(requestId, host, proxyType, newSocket, type) {
    newSocket.requestIds = [requestId];
    newSocket.proxyType = proxyType;
    newSocket.host = host;
    newSocket.type = type;
    const key = this.getHostProxy(host, proxyType);
    let sockets = this.sockets.get(key);
    if (!sockets) {
      sockets = [newSocket];
    } else {
      sockets.push(newSocket);
    }
    this.sockets.set(key, sockets);
  }

  setProxy(requestId, host, hosts, proxy, time) {
    let request = this.cache.get(requestId);
    if (request) {
      request["time"] = time;
      request.proxy = proxy;
      this.cache.set(requestId, request);
    } else {
      this.register(requestId, host, hosts, time);
      this.setProxy(requestId, host, hosts, proxy, time);
    }
  }

  getProxyUrl(requestId) {
    let request = this.cache.get(requestId);
    if (request && request.proxy) {
      return request.proxy;
    }
    return null;
  }

  kill(requestId) {
    this.cache.delete(requestId);
  }

  getAllSocketValues() {
    return Array.from(this.sockets.entries()).flatMap((sockets) => sockets);
  }

  getAllValues() {
    return Array.from(this.cache.entries()).flatMap(([key, values]) => values);
  }

  getAllEntries() {
    return Array.from(this.cache.entries());
  }
}

export default UpcomingRequestCachev2;

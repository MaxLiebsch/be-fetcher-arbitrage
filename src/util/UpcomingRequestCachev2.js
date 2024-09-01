import { LRUCache } from "lru-cache";
import { TTL_UPCOMING_REQUEST } from "../constants.js";

const upcomingRequest = [
  [{ requestId: { proxies: [], hosts: { host1: { sockets: [] } } } }],
];

class UpcomingRequestCachev2 {
  constructor() {
    const options = {
      max: 3200,
      ttl: TTL_UPCOMING_REQUEST,
      ttlAutopurge: true,
    };
    this.cache = new LRUCache(options);
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

  terminateConnections(requestId) {
    let request = this.cache.get(requestId);
    if (request) {
      const hosts = Object.keys(request.hosts);
      if (hosts.length > 0) {
        hosts.forEach((host) => {
          request.hosts[host].sockets.forEach((socket) => {
            try {
              socket.destroy();
              console.log("Socket destroyed:", socket.id , "for", requestId);
            } catch (error) {
              console.error(
                `Failed to terminate connection for ${host}:`,
                error
              );
            }
            // delete request.hosts[host]; we don't need to delete the host
          });
          request.hosts[host].sockets = [];
        });
      }
      if(request.proxies.length > 0) {
        request.proxies = [];
      }
      this.cache.set(requestId, request);
    }
  }

  register(requestId, host, hosts, time) {
    let request = this.cache.get(requestId);
    if (!request) {
      const request = {
        proxies: [],
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

  removeSocket(requestId, host, socketId) {
    let request = this.cache.get(requestId);
    if (request) {
      if (request?.hosts?.[host]) {
        const sockets = request.hosts[host].sockets;
        const index = sockets.findIndex((socket) => socket.id === socketId);
        if (index !== -1) {
          sockets.splice(index, 1);
          this.cache.set(requestId, request);
        }
      }
    }
  }

  killSocket(requestId, host, socketId) {
    let request = this.cache.get(requestId);
    if (request) {
      if (request?.hosts?.[host]) {
        const sockets = request.hosts[host].sockets;
        const index = sockets.findIndex((socket) => socket.id === socketId);
        if (index !== -1) {
          try {
            sockets[index].destroy();
            sockets.splice(index, 1);
            this.cache.set(requestId, request);
          } catch (error) {
            console.error(
              `Failed to kill socket ${socketId} for ${host}:`,
              error
            );
          }
        }
      }
    }
  }

  // We set the sockets when the connection is established.
  setSockets(requestId, host, sockets) {
    let request = this.cache.get(requestId);
    if (request) {
      if (!request.hosts[host]) {
        request.hosts[host] = { sockets: [...sockets] };
      } else {
        request.hosts[host].sockets.push(...sockets);
      }
      this.cache.set(requestId, request);
    }
  }

  setProxy(requestId, host, hosts, proxy, time, cnt = 1) { 
    let request = this.cache.get(requestId) || { proxies: [], hosts: {} };
    request["time"] = time;
    request.proxies = request.proxies.concat(new Array(cnt).fill(proxy));
    if (!request.hosts[host]) {
      request.hosts[host] = { sockets: [] };
    }
    if (hosts.length > 0) {
      hosts.forEach((host) => {
        if (!request.hosts[host]) {
          request.hosts[host] = { sockets: [] };
        }
      });
    }
    this.cache.set(requestId, request);
  }

  getProxyUrl(requestId) {
    let request = this.cache.get(requestId); // { proxies: [], hosts: { host1: {sockets: []} } }
    if (request && request.proxies.length > 0) {
      const { proxies } = request;
      const value = proxies[0]; // Remove and get the first element
      // if (proxies.length === 0) {
      //   this.cache.delete(requestId); // Remove the key if no values left
      // } else {
      //   this.cache.set(requestId, request); // Update the cache with the remaining values
      // }
      return value;
    }
    return null;
  }

  kill(requestId) {
    this.cache.delete(requestId);
  }

  getAllValues() {
    return Array.from(this.cache.entries()).flatMap(([key, values]) => values);
  }

  getAllEntries() {
    return Array.from(this.cache.entries());
  }
}

export default UpcomingRequestCachev2;

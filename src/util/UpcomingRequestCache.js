import { LRUCache } from "lru-cache";
import { TTL_UPCOMING_REQUEST } from "../constants.js";

class UpcomingRequestCache {
  constructor() {
    const options = { max: 70, ttl: TTL_UPCOMING_REQUEST, ttlAutopurge: true };
    this.cache = new LRUCache(options);
  }

  has(key) {
    return this.cache.has(key);
  }

  set(key, value) {
    let values = this.cache.get(key) || [];
    values.push(value);
    this.cache.set(key, values);
  }

  get(key) {
    let values = this.cache.get(key);
    if (values && values.length > 0) {
      const value = values.shift(); // Remove and get the first element
      if (values.length === 0) {
        this.cache.delete(key); // Remove the key if no values left
      } else {
        this.cache.set(key, values); // Update the cache with the remaining values
      }
      return value;
    }
    return null;
  }

  kill(key) {
    this.cache.delete(key);
  }

  getAllValues() {
    return Array.from(this.cache.entries()).flatMap(([key, values]) => values);
  }

  getAllEntries() {
    return Array.from(this.cache.entries());
  }
}

export default UpcomingRequestCache;
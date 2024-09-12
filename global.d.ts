import { MongoClient } from "mongodb";

declare global {
  namespace NodeJS {
    interface Global {
      _mongoClientPool: { [key: string]: Promise<MongoClient> };
    }
  }
}

export {};

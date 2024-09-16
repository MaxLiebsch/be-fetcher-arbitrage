import { ProxyType } from "@dipmaxtech/clr-pkg/lib/types/proxyAuth";
import { Socket } from "net";

export interface TypedSocket extends Socket {
  id: string;
  requestIds: string[];
  proxyType: ProxyType;
  host: string;
  type: string;
}

export type Proxies = Record<ProxyType, string>

export interface UpcomingRequest {
  time: number;
  proxy: string | null;
  hosts: {
    [host: string]: {
      sockets: TypedSocket[];
    };
  };
}

export type ProxyContext = {
  clientSocket: TypedSocket;
  forwardProxyUrl: URL;
  proxyConnectRequest: any; // Replace 'any' with the actual type if known
  head: Buffer;
  hostname: string;
  requestId: string | null;
  requestHost: string;
};

export interface ProxyServiceSearchQuery {
  requestId: string;
  host: string;
  hosts: string;
  proxy: ProxyType;
  prevProxyType: ProxyType;
  time: number;
}

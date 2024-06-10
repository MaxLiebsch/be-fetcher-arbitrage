import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import url, { URL } from "url";

export async function getRedirectUrl(link) {
  try {
    const myURL = new URL("http://127.0.0.1:8080");
    const options = url.urlToHttpOptions(myURL);
    const proxyAgent = new HttpsProxyAgent(options);
    const axiosOptions = {
      maxRedirects: 0, // Prevent axios from following redirects
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    };
    const response = await axios.head(link, axiosOptions);

    // If no redirect happens, return the original URL
    return link;
  } catch (error) {
    if (error.response && error.response.status === 302) {
      // 302 Found indicates a redirect
      return error.response.headers.location;
    } else if (error.response && error.response.status === 301) {
      // 301 Moved Permanently indicates a redirect
      return error.response.headers.location;
    } else {
      throw error; // Rethrow if it's an unexpected error
    }
  }
}
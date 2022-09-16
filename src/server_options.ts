"use strict";

import { networkInterfaces } from "node:os";
import { readFile } from "node:fs/promises";

async function ip() {
  const ifaces = networkInterfaces();

  for (const iface in ifaces)
    for (const i of ['e', 'w'])
      if (iface.startsWith(i)) {
        const curiface = ifaces[iface];
  
        if (curiface) for (const j of curiface)
          if (j && j.family === "IPv4") return j.address;
      }

  return "127.0.0.1";
}

const { signal } = new AbortController();

//signal.onabort = () => console.warn("HTTP Server was aborted!");

export default {
  port: 3000,
  host: await ip(),
  signal,
};

const CERT_CHAINS_FILEPATH = new URL("../localhost.crt", import.meta.url);
const PRIVATE_KEYS_FILEPATH = new URL("../localhost.key", import.meta.url);

export const secureOptions = {
  allowHTTP1: true,
  cert: await readFile(CERT_CHAINS_FILEPATH),
  key: await readFile(PRIVATE_KEYS_FILEPATH),
};

// https://nodejs.org/docs/v18.0.0/api/net.html#serverlistenoptions-callback

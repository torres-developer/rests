"use strict";

import createServer from "./processRequest.js";

const server = await createServer(["GET"], 3000);

server.get?.("/test", (req, res) => {
  res.setHeader("Content-Type", "application/json");

  res.end(JSON.stringify({
    splited: req.url?.split("")
  }));
});

process.on("uncaughtException", (err, origin) => {
  console.error(err.toString(), origin);
});

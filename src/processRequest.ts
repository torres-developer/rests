"use strict";

import type {
  IncomingMessage,
  RequestListener,
  Server as httpServer,
  ServerResponse,
} from "node:http";
import type {
  Server as httpsServer,
} from "node:http";
import type { Http2SecureServer } from "node:http2";

import options, { secureOptions } from "./server_options.js";

async function getServerCreator(): Promise<Function>  {
      const { createServer } = await import("node:http");
  
      return createServer;
  //try {
  //  const { createSecureServer } = await import("node:http2");
  //
  //  return createSecureServer;
  //} catch {
  //  console.debug("HTTP/2 support is disabled");
  //
  //  try {
  //    const { createServer } = await import("node:https");
  //    
  //    return createServer;
  //  } catch {
  //    console.debug("HTTPS support is disabled");
  //
  //    const { createServer } = await import("node:http");
  //
  //    return createServer;
  //  }
  //}
}

/*
 * GET 0 identifier
 * PUT 0 identifier
 * PATCH 0 identifier
 * DELETE identifier
 * POST 0
 *
 * 200 OK *
 * 201 CREATED POST PUT (POST (and PUT) needs header Location with URI to resource)
 * 204 NO CONTENT DELETE PUT
 * 400 BAD REQUEST * (validation errors, missing data, ...)
 * 401 UNAUTHORIZED * (missing/invalid auth token)
 * 403 FORBIDDEN * (no premission, not available, time constrains, ...)
 * 404 NOT FOUND * (no resource, 401/403 secure workaround)
 * 405 METHOD NOT ALLOWED * (method unsupported for the resource so use Allow header to say witch method are supported)
 * 409 CONFLICT * (duplicates, deleting a root)
 * 500 INTERNAL SERVER ERROR * (non-user errors)
 *
 * both JSON and XML
 * use Accept header or file extension on the URI
 *
 * return pagination = links for first last next prev
 *
 * Link header
 *
 * JSON Schemas for docs
 *
 * HAL/Siren/Collection/JSON-LD
 */

type HTTPVerbs = "GET" | "PUT" | "DELETE" | "POST" | "PATCH";

type Entries = Partial<Record<
  Lowercase<HTTPVerbs>,
  (path: string, callback: Path | RequestListener) => void
>>;

type Paths = Map<HTTPVerbs, Map<string, Path>>;
//type Paths = Map<HTTPVerbs, Path>;

type Path = Map<string, Path> | RequestListener;

export default async function (
//async function serve(
  HTTPMethods: HTTPVerbs[] | Set<HTTPVerbs>,
  port: number
): Promise<Entries> {
  const entries: Entries = {},
    paths: Paths = new Map(),
    methods: Set<HTTPVerbs> = HTTPMethods instanceof Set ?
      HTTPMethods :
      new Set(HTTPMethods);

  for (const method of methods) {
    paths.set(method, new Map());

    entries[method.toLowerCase() as Lowercase<HTTPVerbs>] = function (
      path: string,
      callback: Path
    ): void {
      const url = encodeURI(path).split(/\//);
      path.startsWith("/") && url.shift();
      path.endsWith("/") && url.pop();

      const end = url.pop();

      let mapPath = paths.get(method);

      for (const dir of url) {
        if (!(mapPath?.get(dir)))
          mapPath?.set(dir, new Map());

        mapPath = mapPath?.get(dir) as Map<string, Path>;
      }

      mapPath?.set(end ?? "", callback);

      //paths.get(method)?.set(path, callback);
    }
  }

  const server = (await getServerCreator())(
    secureOptions,
    (req: IncomingMessage, res: ServerResponse): void => {
      if (!req.method || !req.url) {
        res.statusCode = 404;
        res.statusMessage = "Not Found";
        res.end();
        return;
      }

      const url = encodeURI(req.url).split(/\//);
      req.url.startsWith("/") && url.shift();
      req.url.endsWith("/") && url.pop();

      let resource: Path | undefined = paths.get(req.method as HTTPVerbs);

      if (resource == undefined) {
        res.statusCode = 404;
        res.statusMessage = "Not Found";
        res.end();
        return;
      }

      while (resource instanceof Map && resource != undefined) {
        const path = url.shift();

        resource = path ? resource.get(path) : undefined;
      }

      if (resource == undefined) {
        res.statusCode = 404;
        res.statusMessage = "Not Found";
        res.end();
        return;
      }

      setDefaultResponseHeaders(res, methods);

      if (typeof resource == "function")
        resource(req, res);

      res.end();
      return;
    }
  );

  if (port) options.port = port;

  handleServer(server, options.port);

  server.listen(options, () => {
    console.log("The server is listening using this options: ", options);
  });

	return entries;
};

function setDefaultResponseHeaders(
  res: ServerResponse,
  methods: Set<HTTPVerbs>
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", [...methods]);
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function handleServer(
  server: httpServer | httpsServer | Http2SecureServer,
  port: number
) {
  console.log(server.constructor.name);

  if (server.constructor.name === "Http2SecureServer")
    handleHttp2SecureServer(server as Http2SecureServer, port);
  else if (server.constructor.name === "Server")
    handleHttpsServer(server as httpsServer, port);
  else if (server.constructor.name === "Server")
    handleHttpServer(server as httpServer, port);
}

function handleHttp2SecureServer(server: Http2SecureServer, port: number) {
  server.on("close", () => {
    console.warn(`HTTP server (port ${port}) was closed`);
  });
	
	server.on("connect", (request, socket, head) => {
  	console.info(request, socket, head);
	});

	server.on("connection", socket => {
  	console.info(socket);
	});

	server.on("request", (request, response) => {
  	console.info(request, response);
	});

	server.on("upgrade", (request, socket, head) => {
    console.info(request, socket, head);
	});
}

function handleHttpsServer(server: httpsServer, port: number) {
  server.on("close", () => {
    console.warn(`HTTP server (port ${port}) was closed`);
  });
	
	server.on("connect", (request, socket, head) => {
  	console.info(request, socket, head);
	});

	server.on("connection", socket => {
  	console.info(socket);
	});

	server.on("request", (request, response) => {
  	console.info(request, response);
	});

	server.on("upgrade", (request, socket, head) => {
    console.info(request, socket, head);
	});
}

function handleHttpServer(server: httpServer, port: number) {
  server.on("close", () => {
    console.warn(`HTTP server (port ${port}) was closed`);
  });
	
	//server.on("connect", (request, socket, head) => {
  //	//console.info(request, socket, head);
	//});

	//server.on("connection", socket => {
  //	//console.info(socket);
	//});

	//server.on("request", (request, response) => {
  //	//console.info(request, response);
	//});

	//server.on("upgrade", (request, socket, head) => {
  //  //console.info(request, socket, head);
	//});
}

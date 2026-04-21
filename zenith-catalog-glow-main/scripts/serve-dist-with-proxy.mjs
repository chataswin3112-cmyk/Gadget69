import { createServer } from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const port = Number(args.get("--port") || process.env.PERF_FRONTEND_PORT || 4173);
const backendOrigin = args.get("--backend") || process.env.PERF_BACKEND_URL || "http://127.0.0.1:8081";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const readRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
};

const writeFetchResponse = async (response, nodeResponse) => {
  const headers = Object.fromEntries(response.headers.entries());
  delete headers["content-encoding"];
  delete headers["transfer-encoding"];
  delete headers.connection;

  nodeResponse.writeHead(response.status, headers);

  if (!response.body) {
    nodeResponse.end();
    return;
  }

  for await (const chunk of response.body) {
    nodeResponse.write(chunk);
  }
  nodeResponse.end();
};

const proxyRequest = async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  const targetUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, backendOrigin);
  const headers = new Headers();

  Object.entries(request.headers).forEach(([key, value]) => {
    if (!value || ["host", "connection", "content-length"].includes(key.toLowerCase())) {
      return;
    }
    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
      return;
    }
    headers.set(key, value);
  });

  const body =
    request.method && ["GET", "HEAD"].includes(request.method.toUpperCase())
      ? undefined
      : await readRequestBody(request);

  const proxied = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  await writeFetchResponse(proxied, response);
};

const serveFile = async (targetPath, response) => {
  const extension = path.extname(targetPath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
  });
  createReadStream(targetPath).pipe(response);
};

const resolveStaticPath = async (requestPath) => {
  const normalizedPath = decodeURIComponent(requestPath.split("?")[0] || "/");
  const candidatePath = path.resolve(distDir, `.${normalizedPath}`);
  if (candidatePath.startsWith(distDir) && existsSync(candidatePath)) {
    const candidateStats = await stat(candidatePath);
    if (candidateStats.isFile()) {
      return candidatePath;
    }
  }

  return path.join(distDir, "index.html");
};

await mkdir(distDir, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    const url = request.url || "/";
    if (url.startsWith("/api") || url.startsWith("/uploads")) {
      await proxyRequest(request, response);
      return;
    }

    const filePath = await resolveStaticPath(url);
    await serveFile(filePath, response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving dist from ${distDir} on http://127.0.0.1:${port} with backend ${backendOrigin}`);
});

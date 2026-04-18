const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'dist');
const BACKEND_ORIGIN = 'http://127.0.0.1:8081';
const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const sendFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
};

const proxyRequest = (req, res) => {
  const target = new URL(req.url, BACKEND_ORIGIN);
  const client = target.protocol === 'https:' ? https : http;
  const proxy = client.request(target, {
    method: req.method,
    headers: req.headers,
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: error.message }));
  });
  req.pipe(proxy);
};

http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end('Missing URL');
    return;
  }

  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    proxyRequest(req, res);
    return;
  }

  const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const resolvedPath = path.join(ROOT, requestPath);
  const safePath = path.normalize(resolvedPath);

  if (safePath.startsWith(ROOT) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    sendFile(res, safePath);
    return;
  }

  sendFile(res, path.join(ROOT, 'index.html'));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`frontend proxy listening on http://127.0.0.1:${PORT}`);
});

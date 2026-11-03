const http = require('http');

const PORT = Number(process.env.PORT || 3002);
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';
const records = [
  {
    "id": 101,
    "name": "Laptop",
    "price": 65000
  },
  {
    "id": 102,
    "name": "Keyboard",
    "price": 1500
  },
  {
    "id": 103,
    "name": "Mouse",
    "price": 800
  }
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'UP', service: SERVICE_NAME });
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/')) {
    return sendJson(res, 200, {
      message: 'Product Service is running',
      endpoints: ['/health', '/product']
    });
  }

  const collectionPath = '/product';
  if (req.method === 'GET' && url.pathname === collectionPath) {
    return sendJson(res, 200, { service: SERVICE_NAME, count: records.length, data: records });
  }

  const match = url.pathname.match(new RegExp('^' + collectionPath + '/([0-9]+)$'));
  if (req.method === 'GET' && match) {
    const record = records.find(item => item.id === Number(match[1]));
    if (!record) return sendJson(res, 404, { error: 'Record not found', id: Number(match[1]) });
    return sendJson(res, 200, record);
  }

  return sendJson(res, 404, { error: 'Route not found', path: url.pathname });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`${SERVICE_NAME} listening on port ${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));

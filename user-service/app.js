const http = require('http');

const PORT = Number(process.env.PORT || 3001);
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';
const records = [
  {
    "id": 1,
    "name": "Arun",
    "email": "arun@example.com"
  },
  {
    "id": 2,
    "name": "Priya",
    "email": "priya@example.com"
  },
  {
    "id": 3,
    "name": "Kumar",
    "email": "kumar@example.com"
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
      message: 'User Service is running',
      endpoints: ['/health', '/user']
    });
  }

  const collectionPath = '/user';
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

const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Test server working!');
});

server.listen(3001, () => {
    console.log('Test server running on port 3001');
});

#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const SettlementEngine = require('./settlement.js');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/settle') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                SettlementEngine.loadData();
                const result = SettlementEngine.validateReplay(data.levelId, data.steps);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    filePath = path.join(__dirname, '..', filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

SettlementEngine.loadData();

server.listen(PORT, () => {
    console.log(`\n  银盐暗房航线推演局 - 本地服务器启动`);
    console.log(`  ======================================`);
    console.log(`  地址: http://localhost:${PORT}`);
    console.log(`  结算API: POST http://localhost:${PORT}/api/settle`);
    console.log(`  ======================================\n`);
});

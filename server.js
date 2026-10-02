import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { generate } from './src/generate.js';

const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const server = http.createServer(async (req, res) => {
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
  if (req.method === 'GET' && req.url === '/health') return send(200, { status: 'ok', mode: 'rules' });
  if (req.method === 'POST' && req.url === '/api/generate') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 64000) return send(413, { error: '入力が長すぎます。' });
      }
      return send(200, generate(JSON.parse(body)));
    } catch (error) { return send(400, { error: error instanceof SyntaxError ? '入力形式が不正です。' : error.message }); }
  }
  const file = files[req.url];
  if (req.method !== 'GET' || !file) return send(404, { error: 'Not found' });
  try {
    const data = await readFile(new URL(`./public/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch { send(500, { error: '画面を読み込めませんでした。' }); }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('MUME server started'));

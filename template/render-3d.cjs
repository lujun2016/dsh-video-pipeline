// 3D 示例渲染：起本地静态服务器（ESM 不能从 file:// 加载），Playwright 逐帧截图
// 用法：node render-3d.cjs [--seconds N] [--out frames/3d]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const fps = (tl.meta && tl.meta.fps) || 30;
const seconds = parseFloat(getArg('--seconds', String((tl.meta && tl.meta.duration) || 30)));
const outDir = getArg('--out', 'frames/3d');
const total = Math.round(fps * seconds);
const root = process.cwd();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(root, url === '/' ? 'three-demo.html' : url);
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

(async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.addInitScript(t => { window.__TIMELINE = t; }, tl);
  await page.goto(`http://127.0.0.1:${port}/three-demo.html`);
  await page.waitForTimeout(1500);
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.__seek(t), i / fps);
    await page.screenshot({ path: path.join(outDir, `${String(i).padStart(5, '0')}.png`) });
    if (i % 150 === 0) console.log(`3d ${i}/${total}`);
  }
  await browser.close();
  server.close();
  console.log(`3d done: ${total} frames → ${outDir}`);
})();

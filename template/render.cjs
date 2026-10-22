// 逐帧渲染：node render.cjs
// 依赖：npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const DUR = 30;            // 改成 index.html 里的总时长
const TOTAL = FPS * DUR;
const dir = 'frames/seq';

(async () => {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve('index.html'));
  await page.waitForTimeout(1000);

  const t0 = Date.now();
  for (let i = 0; i < TOTAL; i++) {
    await page.evaluate(t => window.__seek(t), i / FPS);
    await page.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.png` });
    if (i % 300 === 0) console.log(`frame ${i}/${TOTAL}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
  console.log('frames done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();

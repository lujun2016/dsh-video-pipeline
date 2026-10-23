// 纯代码离屏渲染（可选）：不启动浏览器，直接画 PNG
// 依赖：npm i @napi-rs/canvas
// 用法：node render-offscreen.cjs [--frames N] [--out frames/offscreen]
const fs = require('fs');
const path = require('path');
let createCanvas;
try {
  ({ createCanvas } = require('@napi-rs/canvas'));
} catch (e) {
  console.error('缺少 @napi-rs/canvas，请先运行: npm i @napi-rs/canvas');
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name, d) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : d;
};
const tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const { width, height, duration, fps } = tl.meta;
const outDir = getArg('--out', 'frames/offscreen');
const limit = parseInt(getArg('--frames', '0'), 10);
const total = limit > 0 ? Math.min(limit, Math.round(duration * fps)) : Math.round(duration * fps);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
const FONT = 'PingFang SC, Heiti SC, sans-serif';

function bg(t) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#0b131b');
  g.addColorStop(1, '#070b10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // 点阵
  for (let i = 0; i < 140; i++) {
    const x = (i * 97.13) % width;
    const y = (i * 211.7) % height;
    const a = 0.12 + 0.25 * Math.abs(Math.sin(t * 0.8 + i));
    ctx.fillStyle = `rgba(148,197,220,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, 6.283);
    ctx.fill();
  }
}

function shotAt(t) {
  return tl.shots.find(s => t >= s.start && t < s.end) || tl.shots[tl.shots.length - 1];
}

for (let i = 0; i < total; i++) {
  const t = i / fps;
  bg(t);
  const shot = shotAt(t);
  // 顶部步骤
  ctx.fillStyle = '#5eead4';
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(`OFFSCREEN · ${shot.id.toUpperCase()}`, 80, 240);
  // 标题
  ctx.fillStyle = '#e6edf5';
  ctx.font = `bold 76px ${FONT}`;
  ctx.fillText(shot.name, 80, 360);
  // 进度条
  const p = (t - shot.start) / Math.max(0.001, shot.end - shot.start);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(80, 430, width - 160, 10);
  ctx.fillStyle = '#5eead4';
  ctx.fillRect(80, 430, (width - 160) * Math.min(1, p), 10);
  // 动效：一圈点
  const cx = width / 2, cy = height * 0.55, R = 260;
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2 + t * 0.6;
    const r = 6 + 3 * Math.sin(t * 3 + k);
    ctx.fillStyle = `rgba(94,234,212,${0.35 + 0.35 * Math.sin(t * 2 + k)})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, r, 0, 6.283);
    ctx.fill();
  }
  // 时间码
  ctx.fillStyle = 'rgba(147,164,184,.9)';
  ctx.font = `28px ${FONT}`;
  ctx.fillText(`${t.toFixed(2)}s / ${duration}s`, 80, height - 120);
  fs.writeFileSync(path.join(outDir, `${String(i).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
  if (i % 150 === 0) console.log(`offscreen ${i}/${total}`);
}
console.log(`offscreen done: ${total} frames → ${outDir}`);

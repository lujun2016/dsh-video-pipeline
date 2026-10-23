# 可运行模板（clone 即跑）

## 依赖

- Node.js ≥ 18
- Playwright + Chromium
- ffmpeg
- Python 3 + numpy

```bash
npm i -D playwright
npx playwright install chromium
python3 -m pip install -r requirements.txt
```

## 三步出片

```bash
npm run render     # Playwright 逐帧截图 → frames/seq/
npm run encode     # 合成无声母版 out_silent.mp4
npm run audio      # numpy 合成配乐 → bed.wav
npm run mux        # 混音 → out.mp4
```

或者一条命令：

```bash
npm run build
```

## 改内容

- `timeline.json`：镜头起止、音效事件、音频参数（画面与配乐共用这一份）
- `index.html`：三镜的占位文字与动画，按分镜替换
- `assets/data.js`：真实数据（默认空对象）
- `assets/`：图片素材

改完重新 `npm run build` 即可。

## 可选渲染器

```bash
npm run render:offscreen   # 纯代码离屏（@napi-rs/canvas），输出 frames/offscreen/
npm run render:3d          # three.js 3D 示例，输出 frames/3d/（起本地静态服务器）
```

两个依赖都放在 `optionalDependencies`，`npm i` 会尝试安装；装不上不影响主流程。
离屏渲染没有 DOM 排版，适合无文字镜头；3D 示例可作为关系图/粒子转场的起点。

## 产物

- `out.mp4`：1080×1920 / 30fps / H.264 / AAC
- `out_silent.mp4`：无声母版（换音乐不用重渲）
- `bed.wav`：配乐与音效
- `frames/seq/`：中间帧（可删）

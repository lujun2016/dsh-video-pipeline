# DSH 竖屏解释视频流水线（模板）

用**代码画动画 + 逐帧截图 + ffmpeg 合成**，把一条已完成的工作流水线，做成一条竖屏
（1080×1920）、无声、可复现的解释视频。面向"只有中学知识水平"的观众。

不是抽卡式生成视频，是程序化渲染：同一个 `index.html`，每次渲染出的 MP4 完全一致。

## 目录

| 文件 | 作用 |
|---|---|
| `PROMPT.md` | 直接贴给 DSH 的完整提示词（含占位符） |
| `WORKFLOW.md` | 十个阶段的制作流程、验收点、返工点 |
| `CHECKLIST.md` | 内容/排版/数据/技术的检查清单 |
| `template/` | 可运行的骨架：时间轴、逐帧截图、编码脚本 |
| `docs/lessons.md` | 实际做片时踩过的坑与对策 |
| `docs/audio.md` | numpy 合成配乐与音效、响度标准、混音命令 |
| `docs/3d.md` | three.js 3D 镜头：适用场景、与时间轴集成、中文处理 |
| `docs/renderers.md` | 渲染器选型：Playwright（默认）/ 纯代码离屏（可选）/ 混合 |
| `docs/storyboard.example.md` | 分镜文本稿的格式示例 |

## 快速开始

1. 把 `PROMPT.md` 里的 `{{占位符}}` 换成你的项目信息，整段贴给 DSH。
2. 按 `WORKFLOW.md` 走：先出分镜文本稿，确认后再做画面。
3. 把 `template/index.html` 复制成你的项目 `index.html`，按分镜填镜头。
4. 真实数据写进 `assets/data.js`（`window.DATA = {...}`），图片放 `assets/`。
5. 抽 `timeline.json`（镜头起止 + 音效事件），画面和配乐都读它。
6. `node render.cjs` 逐帧截图 → `bash encode.sh` 合成无声 MP4。
7. `python3 make_audio.py --timeline timeline.json --out bed.wav` 生成配乐。
8. ffmpeg 混音 → 成片；按 `CHECKLIST.md` 验收。

> **v0.2 已可跑**：`template/` 里包含 `timeline.json`、`make_audio.py`、`encode.sh`、`mux.sh`，
> 按 `template/README.md` 的步骤即可从零出片（无声母版 → 配乐 → 混音）。
> `render-offscreen.cjs` 是可选渲染器，用法见 `docs/renderers.md`。

## 依赖

- Node.js ≥ 18
- Playwright（`npm i -D playwright && npx playwright install chromium`）
- ffmpeg（`brew install ffmpeg`）

## 产出

- `out.mp4`：竖屏、无声、H.264
- `index.html` + `assets/`：改文字即可重渲
- `脚本.md`：每镜时间、画面文字、动画
- `README.md`：规格、重渲命令、素材来源

## 许可证

[MIT](LICENSE) © 2026 lujun2016


## 可选模块（已实现）

| 命令 | 说明 |
|---|---|
| `npm run render:offscreen` | 纯代码离屏渲染（@napi-rs/canvas），无 DOM 排版，适合无文字镜头 |
| `npm run render:3d` | three.js 3D 示例（粒子关系图），起本地静态服务器后逐帧截图 |

两者都在 `template/` 下，依赖放在 `optionalDependencies`，装不上不影响主流程。

## 方案版本

- **v0.1**：Canvas 2D + Playwright 逐帧 + ffmpeg 合成（无声）
- **v0.2（当前）**：在 v0.1 上吸收——numpy 合成配乐、`timeline.json` 音画共用、
  three.js 3D 镜头（可选，建议 2–3 镜）、纯代码离屏渲染（可选，用于无文字镜头）

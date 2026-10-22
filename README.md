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
| `docs/storyboard.example.md` | 分镜文本稿的格式示例 |

## 快速开始

1. 把 `PROMPT.md` 里的 `{{占位符}}` 换成你的项目信息，整段贴给 DSH。
2. 按 `WORKFLOW.md` 走：先出分镜文本稿，确认后再做画面。
3. 把 `template/index.html` 复制成你的项目 `index.html`，按分镜填镜头。
4. 真实数据写进 `assets/data.js`（`window.DATA = {...}`），图片放 `assets/`。
5. `node render.cjs` 逐帧截图 → `bash encode.sh` 合成 MP4。
6. 按 `CHECKLIST.md` 验收。

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

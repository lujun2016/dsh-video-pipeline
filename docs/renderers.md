# 渲染器（默认 Playwright，可选纯代码离屏）

## 约定

所有渲染器实现同一个接口：输入 `timeline.json` + 一个时间 `t`，输出一帧 PNG。
帧序号 = `round(t * fps)`。

## 渲染器 A：Playwright（默认）

- 适合：有中文文字、DOM 排版、Canvas / WebGL 混合
- 优点：中文断行 / 字号 / 行高由浏览器负责；three.js 直接可用
- 缺点：每帧约 0.1–0.2 s；需要 Chromium
- 命令：`node render.cjs`

## 渲染器 B：纯代码离屏（可选）

- 适合：整片都是抽象图形 / 3D，没有大段文字
- 实现：node-canvas / skia-canvas，或 Python（PIL + numpy）直接画
- 优点：快（可达 0.01–0.05 s/帧），不依赖浏览器
- 缺点：没有 DOM 排版，中文断行要自己算；three.js 需要 headless-gl
- 命令：`node render-offscreen.cjs`

## 混合模式

- 按镜头选渲染器：`timeline.json` 的 `shots[].renderer` = `dom2d` | `offscreen3d`
- 两种渲染器输出到同一 `frames/seq/`，按帧号合并
- 前提：两边用同一份 timeline 和同一套颜色 / 字体常量

## 选择建议

| 情况 | 选 |
|---|---|
| 有中文正文、注释 | A |
| 纯粒子 / 3D 转场 | B |
| 想省时间且不在乎排版 | B |
| 要改字重渲 | A |

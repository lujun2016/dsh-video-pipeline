# 制作流程（十二个阶段）

## 阶段 0 · 摸清材料
读工作区的 README / HANDOFF / 阶段总结 / 脚本 / 输出目录，列一张表：
步骤名 | 输入 | 输出 | 产物文件 | 关键数字。
**验收**：每个步骤都能指到具体文件；数字有出处。

## 阶段 1 · 选贯穿概念
选一个在每一步都会出现的对象（词、样品、订单、人名）。
**验收**：能在"原料 / 中间产物 / 检索 / 回答 / 关系图"里各找到它一次。

## 阶段 2 · 抽真实例子
每一步各抽 1 个：一段原文、一个 JSON 字段、一条真实分数、一段真实回答。
记下来源文件与行号。
**验收**：所有例子可回溯；没有编造的数字或文本。

## 阶段 3 · 分镜文本稿
按 10 镜模板写：每镜的时间、画面上出现的每一行字、动画方式。
**先给用户确认，不确认不做画面。**

## 阶段 4 · 抽 timeline.json（音画共用）
把镜头起止、事件点、音频参数抽成 `template/timeline.example.json` 的样子：
- `shots[]`：id / start / end / name / renderer
- `events[]`：at / type / sfx / gain
- `audio`：bpm / key / lufs / truePeak

**一次只改这一份时间**：画面和配乐都读它，避免两处对不上。
**验收**：`shots` 首尾相接无空隙；`duration` 等于最后一个 end。

## 阶段 5 · 搭骨架
复制 `template/index.html`：时间轴引擎、安全区、字号、3 个示例镜头。
**验收**：抽 3 帧能看到标题、正文、注解三层。

## 阶段 6 · 逐镜实现（2D / 3D）
- 2D：每镜一个函数；数据放 `assets/data.js`；图片放 `assets/`
- 3D（可选，建议 2–3 镜）：three.js 场景在 `init()` 建一次，`__seek(t)` 里只改相机与
  实例矩阵后 `render()`；中文仍用 DOM 覆盖层
- 术语首次出现时加注解行；关系图画线并标关系词

**验收**：每镜单独抽帧可读；3D 镜不出现文字糊在模型上的情况。

## 阶段 7 · 关键帧检查
抽 8–12 个时间点截图，逐张查：溢出、重叠、被底部 360px 挡住、空白帧、3D 镜头是否可读。
**这一步通常要改 2–3 轮**，改完再全量渲染。

## 阶段 8 · 全量渲染（选渲染器）
- 默认：`node render.cjs`（Playwright，中文排版最好）
- 可选：`node render-offscreen.cjs`（纯代码离屏，快，但无 DOM 排版）
- 混合：`timeline.json` 的 `shots[].renderer` 决定每镜用哪个，帧号统一

约 0.16 秒/帧；170 秒 ≈ 5100 帧 ≈ 14 分钟。

## 阶段 9 · 配乐与音效（numpy）
`python3 make_audio.py --timeline timeline.json --out bed.wav`
- 铺底 pad + 轻节奏 + 转场 whoosh + 数字 tick
- 音效落点从 `events[]` 读，提前 1 帧
- 详见 `docs/audio.md`

## 阶段 10 · 混音
```bash
ffmpeg -y -i out_silent.mp4 -i bed.wav -c:v copy -c:a aac -b:a 192k \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -shortest out.mp4
```
先出无声母版，再混音——换音乐不用重渲视频。

## 阶段 11 · 核验
- `ffprobe`：分辨率、30fps、时长、音轨存在
- 响度：-16 LUFS，真峰值 ≤ -1.5 dBTP，无削波
- 音画同步：抽 3 个转场点，听/看是否对齐
- 再抽 5 帧看首尾与转场

## 阶段 12 · 清理与交付
删 `frames/`（可达数 GB），保留 MP4、index.html、assets、timeline.json、bed.wav、
脚本.md、README.md。

---

## 返工点（提前预判）
| 现象 | 原因 | 处理 |
|---|---|---|
| 帧与帧之间跳变 | 用了 CSS transition/animation | 全部改成由 t 计算 |
| 文字被切掉/重叠 | 长句 + 固定宽度 | 缩短文案或加宽；抽帧检查 |
| 底部被平台 UI 挡住 | 未留 360px 安全区 | 注解上移 |
| 图片放大裁切对不准 | 像素坐标靠猜 | 改用「原图红框 + 图例」 |
| 渲染中途空白 | 分镜时间区间有缝 | 检查 shots 首尾相接 |
| 音画不同步 | 画面和音频各写一份时间 | 统一读 timeline.json |
| 配乐盖过人声/信息 | 铺底太响 | 铺底压到 -22 ~ -18 dBFS |
| 3D 镜头文字糊 | 用 TextGeometry 排中文 | 中文改用 DOM 覆盖层 |

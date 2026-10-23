# 配乐与音效（numpy 合成）

## 为什么用 numpy 合成

- **零版权**：全部由代码生成，不用找 BGM
- **可复现**：同一份脚本 + 同一个随机种子 = 同一个 wav
- **可参数化**：改 bpm / 调性 / 情绪只改几个数
- **缺点**：电子味，做不了人声和真实乐器；对工程讲解片够用

## 信号链

1. **铺底 pad**：3–4 个正弦/三角波，轻微失谐（±3 cent），慢 LFO 调制音量
2. **低通**：一阶低通去掉高频毛刺（截止 2–4 kHz）
3. **节奏**：90 BPM；kick（正弦下滑 80→40 Hz）+ hat（白噪声 20 ms 衰减），音量压到约 -24 dB
4. **转场**：whoosh = 白噪声 + 带通扫频（300 Hz → 4 kHz，0.35 s）
5. **数字滚动**：tick = 1.2 kHz 正弦，15 ms，约 -18 dB

## 时间轴

所有音效落点从 `timeline.json` 的 `events[]` 读，与画面共用同一份时间。
帧量化误差 ±1/30 s，音效**提前 1 帧**放，听感更准。

## 混音标准

- 采样率 48 kHz，16-bit，立体声
- 铺底 -22 ~ -18 dBFS；音效 -12 ~ -8 dBFS
- 总响度 **-16 LUFS**，真峰值 **-1.5 dBTP**（平台一般归一到 -14，-16 留余量）
- 首尾各 1.5 s 淡入淡出

## 命令

```bash
python3 make_audio.py --timeline timeline.json --out bed.wav

ffmpeg -y -i out_silent.mp4 -i bed.wav -c:v copy -c:a aac -b:a 192k \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -shortest out.mp4
```

## 交付

- `out_silent.mp4`：无声母版（先出，便于反复换音乐）
- `bed.wav`：配乐与音效
- `out.mp4`：成片

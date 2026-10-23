#!/usr/bin/env python3
"""
用 numpy 合成配乐与音效，读取 timeline.json，输出 bed.wav。
用法:
    python3 make_audio.py --timeline timeline.json --out bed.wav
依赖: numpy
"""
import argparse, json, math, wave
import numpy as np

SR = 48000

def sec(n, sr=SR):
    return np.arange(n) / sr

def env_ad(n, attack, decay, sr=SR):
    """attack 线性上升，decay 指数衰减"""
    e = np.zeros(n)
    a = max(1, int(attack * sr))
    e[:a] = np.linspace(0.0, 1.0, a, endpoint=False)
    d = n - a
    if d > 0:
        e[a:] = np.exp(-np.linspace(0.0, 5.0, d))
    return e

def sine(f, n, phase=0.0):
    return np.sin(2 * np.pi * f * sec(n) + phase)

def sweep(f0, f1, n):
    """频率线性扫描的正弦（相位积分）"""
    t = sec(n)
    f = np.linspace(f0, f1, n)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase)

def fft_filter(x, lo=None, hi=None):
    """FFT 静态带通/低通，向量化，速度快"""
    n = len(x)
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    mask = np.ones_like(freqs)
    if lo is not None:
        mask *= 1.0 / (1.0 + (lo / np.maximum(freqs, 1e-6)) ** 4)
    if hi is not None:
        mask *= 1.0 / (1.0 + (freqs / hi) ** 4)
    return np.fft.irfft(X * mask, n)

def pad(duration, bpm, key):
    """铺底：4 和弦循环，三音叠加 + 轻微失谐 + 慢 LFO"""
    chords = {
        "A minor": [[110.00, 130.81, 164.81], [87.31, 110.00, 130.81],
                    [130.81, 164.81, 196.00], [98.00, 123.47, 146.83]],
    }
    prog = chords.get(key, chords["A minor"])
    beat = 60.0 / bpm
    bar = 4 * beat
    n = int(duration * SR)
    out = np.zeros(n)
    pos = 0
    i = 0
    while pos < n:
        L = min(int(bar * SR), n - pos)
        if L <= 0: break
        e = env_ad(L, attack=0.6, decay=bar * 0.25)
        seg = np.zeros(L)
        for f in prog[i % len(prog)]:
            seg += sine(f, L, phase=i * 0.7) * 0.5
            seg += sine(f * 1.003, L, phase=i * 1.3) * 0.25
            seg += sine(f * 0.997, L, phase=i * 2.1) * 0.25
            seg += sine(f / 2, L, phase=i * 0.3) * 0.18
        out[pos:pos + L] += seg * e
        pos += L
        i += 1
    out = fft_filter(out, hi=2800.0)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.08 * sec(n))
    return out * lfo * 0.18

def drums(duration, bpm):
    """轻节奏：kick 每拍，hat 每半拍，音量压得很低"""
    beat = 60.0 / bpm
    n = int(duration * SR)
    out = np.zeros(n)
    t = 0.0
    while t < duration:
        L = int(0.18 * SR)
        start = int(t * SR)
        if start + L < n:
            e = env_ad(L, 0.002, 0.15)
            k = sweep(80, 40, L) * e * 0.10
            out[start:start + L] += k
        t += beat
    t = 0.0
    while t < duration:
        L = int(0.05 * SR)
        start = int(t * SR)
        if start + L < n:
            noise = np.random.default_rng(int(t * 1000)).standard_normal(L)
            e = env_ad(L, 0.001, 0.03)
            h = fft_filter(noise, lo=6000.0) * e * 0.025
            out[start:start + L] += h
        t += beat / 2
    return out

def whoosh(duration, at):
    """转场：噪声 + 上扫正弦，0.35s"""
    L = int(0.35 * SR)
    start = int(max(0.0, at) * SR)
    seg = np.zeros(min(L, max(0, int(duration * SR) - start)))
    if len(seg) == 0:
        return np.zeros(0)
    n = len(seg)
    rng = np.random.default_rng(int(at * 10000))
    noise = rng.standard_normal(n)
    e = env_ad(n, 0.05, 0.30)
    sweep_tone = sweep(200, 900, n) * 0.25
    seg = fft_filter(noise, lo=250.0, hi=5000.0) * e + sweep_tone * e
    return seg

def tick():
    L = int(0.02 * SR)
    return sine(1200, L) * env_ad(L, 0.001, 0.012) * 0.18

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", required=True)
    ap.add_argument("--out", default="bed.wav")
    args = ap.parse_args()

    tl = json.load(open(args.timeline, encoding="utf-8"))
    meta = tl.get("meta", {})
    duration = float(meta.get("duration", 30))
    audio = tl.get("audio", {})
    bpm = float(audio.get("bpm", 90))

    n = int(duration * SR)
    mix = np.zeros(n)

    mix += pad(duration, bpm, audio.get("key", "A minor"))
    mix += drums(duration, bpm)

    fps = float(meta.get("fps", 30))
    for ev in tl.get("events", []):
        at = float(ev.get("at", 0))
        gain = float(ev.get("gain", 0.5))
        kind = ev.get("sfx") or ev.get("type")
        if kind in ("whoosh", "transition"):
            seg = whoosh(duration, max(0.0, at - 1.0 / fps))
            s = int(max(0.0, at - 1.0 / fps) * SR)
            mix[s:s + len(seg)] += seg * gain * 0.6
        elif kind in ("tick", "counter"):
            seg = tick()
            s = int(at * SR)
            if s + len(seg) < n:
                mix[s:s + len(seg)] += seg * gain

    # 软限幅 + 归一 + 首尾淡入淡出
    mix = np.tanh(mix * 1.2)
    peak = float(np.max(np.abs(mix))) or 1.0
    mix = mix / peak * 0.85
    fade = int(1.5 * SR)
    if fade * 2 < n:
        mix[:fade] *= np.linspace(0, 1, fade)
        mix[-fade:] *= np.linspace(1, 0, fade)

    stereo = np.stack([mix, np.roll(mix, int(0.006 * SR))], axis=1)
    stereo[:int(0.006 * SR), 1] = 0
    data = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)

    with wave.open(args.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

    print(f"wrote {args.out}  {duration:.1f}s  {SR}Hz  stereo  peak={peak:.3f}")

if __name__ == "__main__":
    main()

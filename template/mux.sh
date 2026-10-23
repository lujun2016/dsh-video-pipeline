#!/bin/bash
# 混音：无声母版 + bed.wav → out.mp4
set -e
if [ -f bed.wav ]; then
  ffmpeg -y -i out_silent.mp4 -i bed.wav -c:v copy -c:a aac -b:a 192k \
    -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -shortest out.mp4
else
  echo "未找到 bed.wav，输出无声版"
  cp out_silent.mp4 out.mp4
fi
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate -of default=nw=1 out.mp4

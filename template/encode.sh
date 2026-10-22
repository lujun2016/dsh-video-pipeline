#!/bin/bash
set -e
ffmpeg -y -framerate 30 -i frames/seq/%05d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -movflags +faststart -an out.mp4
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate -of default=nw=1 out.mp4

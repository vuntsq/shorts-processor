#!/usr/bin/env bash
# ============================================================
# scripts/forza.sh — FFmpeg pipeline for Forza clips
# ============================================================
# Inputs (set by index.js):
#   INPUT  = absolute path to source clip
#   OUTPUT = absolute path for output .mp4
#
# What this does:
#   1. Scales source to fill 1080×1920 background, blurs & dims it
#   2. Scales the original video to fit within 1080×1531 (pillarbox-safe)
#   3. Overlays the sharp video centred on the blurred background
#   4. Encodes H.264 at CRF 12 (high quality), 60fps, AAC audio
# ============================================================

set -euo pipefail

INPUT="${INPUT:?INPUT env var is required}"
OUTPUT="${OUTPUT:?OUTPUT env var is required}"

echo "📥  Input  : $INPUT"
echo "📤  Output : $OUTPUT"

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg \
  -i "$INPUT" \
  -filter_complex "
    [0:v]scale=1080:1920,setsar=1[bg];
    [bg]boxblur=10:2,eq=brightness=-0.15[blurred];
    [0:v]scale=-1:1385[main];
    [blurred][main]overlay=(1080-w)/2:(1920-h)/2[out]
  " \
  -map "[out]" \
  -map "0:a" \
  -c:v libx264 \
  -crf 12 \
  -preset slow \
  -r 60 \
  -c:a aac \
  -movflags +faststart \
  -y \
  "$OUTPUT"

echo "✅  Encode complete: $OUTPUT"
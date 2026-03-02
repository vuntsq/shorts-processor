#!/usr/bin/env bash
# ============================================================
# scripts/forza.sh — FFmpeg pipeline for Forza clips
# ============================================================
# Same 9:16 crop/scale as cod.sh.
# Slightly lower CRF (22) for higher quality on detail-heavy
# racing scenes with lots of motion blur.
# ============================================================

set -euo pipefail

INPUT="${INPUT:?INPUT env var is required}"
OUTPUT="${OUTPUT:?OUTPUT env var is required}"

echo "📥  Input  : $INPUT"
echo "📤  Output : $OUTPUT"

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg \
  -i "$INPUT" \
  -vf "
    crop=
      'min(iw\, ih*9/16)':
      'min(ih\, iw*16/9)':
      '(iw - min(iw\, ih*9/16))/2':
      '(ih - min(ih\, iw*16/9))/2',
    scale=1080:1920:flags=lanczos
  " \
  -c:v libx264 \
  -crf 22 \
  -preset fast \
  -profile:v high \
  -level 4.2 \
  -c:a aac \
  -b:a 192k \
  -ar 44100 \
  -movflags +faststart \
  -y \
  "$OUTPUT"

echo "✅  Encode complete: $OUTPUT"
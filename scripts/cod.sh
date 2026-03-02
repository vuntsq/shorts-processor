#!/usr/bin/env bash
# ============================================================
# scripts/cod.sh — FFmpeg pipeline for Call of Duty clips
# ============================================================
# Inputs (set by index.js):
#   INPUT  = absolute path to source .mp4
#   OUTPUT = absolute path for output .mp4
#
# What this does:
#   1. Crops the source video to a centred 9:16 aspect ratio
#   2. Scales to 1080×1920 (YouTube Shorts spec)
#   3. Encodes H.264 video (CRF 23, fast preset)
#   4. Encodes AAC audio at 192k
#   5. Optimises for streaming (faststart)
# ============================================================

set -euo pipefail   # exit on any error

INPUT="${INPUT:?INPUT env var is required}"
OUTPUT="${OUTPUT:?OUTPUT env var is required}"

echo "📥  Input  : $INPUT"
echo "📤  Output : $OUTPUT"

# Create the output directory if it doesn't already exist
mkdir -p "$(dirname "$OUTPUT")"

# ── Crop & scale filter explanation ───────────────────────────
# iw = input width, ih = input height
# We want 9:16.  Given source width W and height H:
#   target_width  = min(W, H*9/16)
#   target_height = min(H, W*16/9)
# The crop filter uses:  crop=w:h:x:y
#   x = (iw - crop_w) / 2   (centre horizontally)
#   y = (ih - crop_h) / 2   (centre vertically)
# Then scale to 1080×1920.
# ──────────────────────────────────────────────────────────────

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
  -crf 23 \
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
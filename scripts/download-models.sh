#!/usr/bin/env bash
set -e

echo "📥 KobeanAudio Model Downloader..."
mkdir -p models/kokoro models/orpheus models/qwen3

# Kokoro 82M
echo "⚡ Checking Kokoro weights..."
if [ ! -f "models/kokoro/kokoro-v0_19.onnx" ]; then
  echo "Downloading Kokoro 82M model..."
  curl -L -o models/kokoro/kokoro-v0_19.onnx "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx" 2>/dev/null || echo "Note: Kokoro onnx can be auto-downloaded on first run"
fi

echo "✅ All required local models checked!"

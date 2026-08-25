#!/usr/bin/env bash
set -e

echo "🎧 Setting up KobeanAudio Studio on Apple Silicon Mac..."

# Ensure directories exist
mkdir -p audio_output temp_audio models/kokoro models/orpheus models/chatterbox

# Setup Python Virtual Environment
echo "🐍 Initializing Python virtual environment..."
python3 -m venv apps/api/.venv
source apps/api/.venv/bin/activate
pip install --upgrade pip
pip install -r <(python3 -c "import tomllib; f=open('apps/api/pyproject.toml', 'rb'); data=tomllib.load(f); print('\n'.join(data['project']['dependencies']))")

# Setup Node packages
echo "📦 Installing Node dependencies..."
pnpm install

echo "✅ KobeanAudio setup complete! Start the studio by running: pnpm dev"

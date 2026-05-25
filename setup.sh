#!/bin/bash
# Setup untuk Windows (Git Bash / PowerShell)
set -e

echo "=============================="
echo "  SAMTEK VCA - Setup Script"
echo "=============================="

echo ""
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt
echo "✅ Python deps installed"

echo ""
echo "📦 Installing Node dependencies..."
cd frontend
npm install
cd ..
echo "✅ Node deps installed"

echo ""
echo "🤖 Downloading YOLOv8 model..."
cd backend
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
cd ..
echo "✅ YOLOv8 model ready"

mkdir -p captures assets
echo "✅ Folders created"

echo ""
echo "=============================="
echo "  Setup selesai!"
echo "=============================="

#!/bin/bash

# Poolsuite Last.fm Scrobbler - Icon Generator
# This script creates placeholder icons for the extension

echo "🎵 Poolsuite Last.fm Scrobbler - Icon Generator"
echo "================================================"
echo

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Please run this script from the extension directory."
    exit 1
fi

echo "✅ Found manifest.json"

# Check if icons already exist
if [ -f "icons/icon-96.png" ]; then
    echo "ℹ️  Icons already exist. Skipping..."
    exit 0
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Create simple placeholder icons
echo "📱 Creating placeholder icons..."

# Create a simple SVG icon and convert to different sizes
cat > icons/icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#FF6B6B" rx="20"/>
  <text x="64" y="85" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="white">♪</text>
  <text x="64" y="25" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="white">SCROBBLER</text>
</svg>
EOF

# Check if we have ImageMagick or another tool to convert SVG to PNG
if command -v convert &> /dev/null; then
    echo "🖼️  Converting SVG to PNG icons using ImageMagick..."
    convert icons/icon.svg -resize 16x16 icons/icon-16.png
    convert icons/icon.svg -resize 32x32 icons/icon-32.png
    convert icons/icon.svg -resize 48x48 icons/icon-48.png
    convert icons/icon.svg -resize 128x128 icons/icon-128.png
    rm icons/icon.svg
    echo "✅ Icons created successfully"
elif command -v sips &> /dev/null; then
    # macOS built-in tool
    echo "🖼️  Converting SVG to PNG icons using sips..."
    sips -s format png icons/icon.svg --out icons/icon-128.png -Z 128 &> /dev/null
    sips -s format png icons/icon.svg --out icons/icon-48.png -Z 48 &> /dev/null
    sips -s format png icons/icon.svg --out icons/icon-32.png -Z 32 &> /dev/null
    sips -s format png icons/icon.svg --out icons/icon-16.png -Z 16 &> /dev/null
    rm icons/icon.svg
    echo "✅ Icons created successfully"
else
    echo "⚠️  No image conversion tool found. You'll need to create the icons manually."
    echo "   Required: icon-16.png, icon-32.png, icon-48.png, icon-128.png"
    rm icons/icon.svg
fi

echo
echo "✅ Icon generation complete!"
echo
echo "Next Steps:"
echo
echo "1. 🦊 Load the extension in Firefox:"
echo "   → Open Firefox and go to: about:debugging"
echo "   → Click 'This Firefox'"
echo "   → Click 'Load Temporary Add-on...'"
echo "   → Select manifest.json from this directory"
echo
echo "2. 🔐 Login to Last.fm (one-time setup):"
echo "   → Click the extension icon or go to extension options"
echo "   → Click 'Login with Last.fm'"
echo "   → Authorize on Last.fm (opens in browser)"
echo "   → Return to options and click 'Complete Login'"
echo
echo "3. 🎶 Start scrobbling:"
echo "   → Visit https://poolsuite.net"
echo "   → Play some music - it will automatically scrobble!"
echo
echo "📖 For more installation options, see README.md"
echo
echo "Happy scrobbling! 🎵"

#!/bin/bash

# Unified DRM Content Generation Script for Cloakscreen
# Generates DRM-protected content with multiple format options

set -e

# Default configuration
CONTENT_ID="blank"
INPUT_VIDEO="public/dash_assets/source.mp4"
DASH_OUTPUT_DIR="public/dash_assets"
HLS_OUTPUT_DIR="public/hls_assets"
CMAF_OUTPUT_DIR="public/cmaf_assets"

# Parse command line arguments
PACKAGING_TYPE="multi"  # Default: generate both DASH and HLS

while [[ $# -gt 0 ]]; do
  case $1 in
    --type)
      PACKAGING_TYPE="$2"
      shift 2
      ;;
    --content-id)
      CONTENT_ID="$2"
      shift 2
      ;;
    --input)
      INPUT_VIDEO="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --type TYPE        Packaging type: multi (default), dash, hls, cmaf"
      echo "  --content-id ID    Content ID (default: blank)"
      echo "  --input FILE       Input video file (default: public/dash_assets/source.mp4)"
      echo "  --help             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Generate both DASH and HLS"
      echo "  $0 --type cmaf               # Generate CMAF (all DRM types)"
      echo "  $0 --type dash               # Generate DASH only"
      echo "  $0 --type hls                # Generate HLS only"
      echo "  $0 --content-id my-content   # Use custom content ID"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

KMS_TOKEN="${KMS_TOKEN:-$DRM_KMS_TOKEN}"

echo "🛡️ Cloakscreen DRM Content Generation"
echo "====================================="
echo "Packaging Type: $PACKAGING_TYPE"
echo "Content ID: $CONTENT_ID"
echo "Input Video: $INPUT_VIDEO"

case $PACKAGING_TYPE in
  multi)
    echo "DASH Output: $DASH_OUTPUT_DIR"
    echo "HLS Output: $HLS_OUTPUT_DIR"
    ;;
  cmaf)
    echo "CMAF Output: $CMAF_OUTPUT_DIR"
    ;;
  dash)
    echo "DASH Output: $DASH_OUTPUT_DIR"
    ;;
  hls)
    echo "HLS Output: $HLS_OUTPUT_DIR"
    ;;
esac
echo ""

# Check if input video exists, generate if not found
if [ ! -f "$INPUT_VIDEO" ]; then
    echo "📹 Input video not found. Generating source video..."
    npm run generate-video
    
    # Check again after generation
    if [ ! -f "$INPUT_VIDEO" ]; then
        echo "❌ Error: Failed to generate input video at $INPUT_VIDEO"
        echo "💡 Please check FFmpeg installation and try again"
        exit 1
    fi
    echo "✅ Source video generated successfully!"
fi

# Check if KMS token is provided
if [ -z "$KMS_TOKEN" ]; then
    echo "❌ Error: KMS_TOKEN environment variable is required"
    echo "💡 Get your KMS token from DoveRunner Console → Multi-DRM Settings"
    echo "💡 Usage: KMS_TOKEN='your_token_here' ./scripts/generate-multi-drm-content.sh"
    exit 1
fi

# Build Docker image if it doesn't exist
echo "🐳 Building DoveRunner CLI Docker image..."
docker build -f Dockerfile.packager -t doverunner-cli .

# Create temporary directories
TEMP_DIR=$(mktemp -d)
INPUT_DIR="$TEMP_DIR/input"
DASH_TEMP="$TEMP_DIR/dash_output"
HLS_TEMP="$TEMP_DIR/hls_output"

mkdir -p "$INPUT_DIR" "$DASH_TEMP" "$HLS_TEMP"

# Copy input video
cp "$INPUT_VIDEO" "$INPUT_DIR/"
INPUT_FILENAME=$(basename "$INPUT_VIDEO")

# Generate content based on packaging type
case $PACKAGING_TYPE in
  multi)
    echo ""
    echo "📦 Step 1: Generating DASH content (Widevine + PlayReady)..."
    echo "========================================================="
    
    docker run --rm \
        -v "$INPUT_DIR:/app/input" \
        -v "$DASH_TEMP:/app/output" \
        doverunner-cli \
        --enc_token "$KMS_TOKEN" \
        --content_id "$CONTENT_ID" \
        --dash \
        -i "/app/input/$INPUT_FILENAME" \
        -o "/app/output/"
    
    if [ ! -d "$DASH_TEMP/dash" ]; then
        echo "❌ Error: DASH packaging failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ DASH content generated successfully!"
    
    echo ""
    echo "📦 Step 2: Generating HLS content (FairPlay)..."
    echo "==============================================="
    
    docker run --rm \
        -v "$INPUT_DIR:/app/input" \
        -v "$HLS_TEMP:/app/output" \
        doverunner-cli \
        --enc_token "$KMS_TOKEN" \
        --content_id "$CONTENT_ID" \
        --hls \
        -i "/app/input/$INPUT_FILENAME" \
        -o "/app/output/"
    
    if [ ! -d "$HLS_TEMP/hls" ]; then
        echo "❌ Error: HLS packaging failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ HLS content generated successfully!"
    ;;
    
  dash)
    echo ""
    echo "📦 Generating DASH content (Widevine + PlayReady)..."
    echo "=================================================="
    
    docker run --rm \
        -v "$INPUT_DIR:/app/input" \
        -v "$DASH_TEMP:/app/output" \
        doverunner-cli \
        --enc_token "$KMS_TOKEN" \
        --content_id "$CONTENT_ID" \
        --dash \
        -i "/app/input/$INPUT_FILENAME" \
        -o "/app/output/"
    
    if [ ! -d "$DASH_TEMP/dash" ]; then
        echo "❌ Error: DASH packaging failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ DASH content generated successfully!"
    ;;
    
  hls)
    echo ""
    echo "📦 Generating HLS content (FairPlay)..."
    echo "======================================"
    
    docker run --rm \
        -v "$INPUT_DIR:/app/input" \
        -v "$HLS_TEMP:/app/output" \
        doverunner-cli \
        --enc_token "$KMS_TOKEN" \
        --content_id "$CONTENT_ID" \
        --hls \
        -i "/app/input/$INPUT_FILENAME" \
        -o "/app/output/"
    
    if [ ! -d "$HLS_TEMP/hls" ]; then
        echo "❌ Error: HLS packaging failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ HLS content generated successfully!"
    ;;
    
  cmaf)
    echo ""
    echo "📦 Generating CMAF content (All DRM types)..."
    echo "============================================"
    
    CMAF_TEMP="$TEMP_DIR/cmaf_output"
    mkdir -p "$CMAF_TEMP"
    
    docker run --rm \
        -v "$INPUT_DIR:/app/input" \
        -v "$CMAF_TEMP:/app/output" \
        doverunner-cli \
        --enc_token "$KMS_TOKEN" \
        --content_id "$CONTENT_ID" \
        --cmaf \
        -i "/app/input/$INPUT_FILENAME" \
        -o "/app/output/"
    
    if [ ! -d "$CMAF_TEMP/cmaf" ]; then
        echo "❌ Error: CMAF packaging failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ CMAF content generated successfully!"
    ;;
esac

echo ""
echo "📁 Step 3: Organizing output files..."
echo "====================================="

# Copy generated content to output directories
case $PACKAGING_TYPE in
  multi)
    mkdir -p "$DASH_OUTPUT_DIR" "$HLS_OUTPUT_DIR"
    echo "📋 Copying DASH content to $DASH_OUTPUT_DIR..."
    cp -r "$DASH_TEMP/dash/"* "$DASH_OUTPUT_DIR/"
    echo "📋 Copying HLS content to $HLS_OUTPUT_DIR..."
    cp -r "$HLS_TEMP/hls/"* "$HLS_OUTPUT_DIR/"
    ;;
  dash)
    mkdir -p "$DASH_OUTPUT_DIR"
    echo "📋 Copying DASH content to $DASH_OUTPUT_DIR..."
    cp -r "$DASH_TEMP/dash/"* "$DASH_OUTPUT_DIR/"
    ;;
  hls)
    mkdir -p "$HLS_OUTPUT_DIR"
    echo "📋 Copying HLS content to $HLS_OUTPUT_DIR..."
    cp -r "$HLS_TEMP/hls/"* "$HLS_OUTPUT_DIR/"
    ;;
  cmaf)
    mkdir -p "$CMAF_OUTPUT_DIR"
    echo "📋 Copying CMAF content to $CMAF_OUTPUT_DIR..."
    cp -r "$CMAF_TEMP/cmaf/"* "$CMAF_OUTPUT_DIR/"
    ;;
esac

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "✅ DRM content generation completed successfully!"
echo ""

# Show generated files based on packaging type
case $PACKAGING_TYPE in
  multi)
    echo "📋 Generated DASH files (Widevine/PlayReady):"
    ls -la "$DASH_OUTPUT_DIR"
    echo ""
    echo "📋 Generated HLS files (FairPlay):"
    ls -la "$HLS_OUTPUT_DIR"
    echo ""
    echo "🎯 DRM Routing Summary:"
    echo "======================"
    echo "• Safari (FairPlay):     /hls_assets/master.m3u8"
    echo "• Chrome (Widevine):     /dash_assets/stream.mpd"
    echo "• Firefox (Widevine):    /dash_assets/stream.mpd"
    echo "• Edge (PlayReady):      /dash_assets/stream.mpd"
    echo ""
    echo "📖 Content URLs:"
    echo "   DASH: http://localhost:3000/dash_assets/stream.mpd"
    echo "   HLS:  http://localhost:3000/hls_assets/master.m3u8"
    ;;
  dash)
    echo "📋 Generated DASH files (Widevine/PlayReady):"
    ls -la "$DASH_OUTPUT_DIR"
    echo ""
    echo "📖 Content URL:"
    echo "   DASH: http://localhost:3000/dash_assets/stream.mpd"
    ;;
  hls)
    echo "📋 Generated HLS files (FairPlay):"
    ls -la "$HLS_OUTPUT_DIR"
    echo ""
    echo "📖 Content URL:"
    echo "   HLS: http://localhost:3000/hls_assets/master.m3u8"
    ;;
  cmaf)
    echo "📋 Generated CMAF files (All DRM types):"
    ls -la "$CMAF_OUTPUT_DIR"
    echo ""
    echo "🎯 CMAF DRM Support:"
    echo "==================="
    echo "• Safari (FairPlay):     ✅ Supported"
    echo "• Chrome (Widevine):     ✅ Supported"
    echo "• Firefox (Widevine):    ✅ Supported"
    echo "• Edge (PlayReady):      ✅ Supported"
    echo ""
    echo "📖 Content URL:"
    echo "   CMAF: http://localhost:3000/cmaf_assets/stream.mpd"
    ;;
esac

echo ""
echo "🚀 Next steps:"
echo "1. Start your server: npm start"
echo "2. Visit: http://localhost:3000/examples/drm-detection-demo.html"
echo "3. Test multi-DRM protection across different browsers!"
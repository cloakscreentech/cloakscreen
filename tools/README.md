# Cloakscreen Tools

This directory contains utility tools for working with Cloakscreen.

## DRM Video Generator

The DRM video generator creates a simple solid-color video to be used as the middle layer in the Cloakscreen three-layer protection system.

### Usage (Requires FFmpeg)

```bash
# Generate a default 100x100 white video
npm run generate-video

# Or run directly
node tools/generate-drm-video.js

# Generate a custom video
node tools/generate-drm-video.js --width=200 --height=200 --color=black --output=public/dash_assets/stream.mp4 --duration=2 --fps=30
```

### Available Options

- `--width=100` - Width of the video in pixels (default: 100)
- `--height=100` - Height of the video in pixels (default: 100)
- `--color=white` - Color of the video (default: white)
- `--output=stream.mp4` - Output filename (default: stream.mp4)
- `--duration=1` - Duration in seconds (default: 1)
- `--fps=1` - Frames per second (default: 1)

### Supported Colors

- Named colors: `white`, `black`, `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `gray`
- Hex colors: `#ffffff`, `#000000`, etc.
- Transparent: `transparent` (for overlay effects)

## Why Do I Need This?

The middle layer DRM video is a crucial component of the Cloakscreen system. It acts as a "shield" that blocks screenshot tools and AI vision models from seeing the content.

For the three-layer sandwich to work properly:

1. The video must be a solid color (typically white to match background)
2. The video must be DRM-protected using your DRM provider
3. The video must be the same size or larger than your content

## Video Requirements

- **Format**: MP4 with H.264 encoding
- **Color**: Solid color (typically white to match background)
- **Size**: At least as large as the content you want to protect
- **Duration**: Can be short (1 second) as it will loop
- **DRM**: Must be encrypted with your DRM provider (PallyCon, etc.)

## Using the Generated Video

After generating the video:

1. Place it in your `public/dash_assets/` directory
2. Encrypt it with your DRM provider (PallyCon/DoveRunner)
3. Create a DASH manifest (.mpd file) for the encrypted video
4. Update your PallyCon provider configuration to use this manifest

**For detailed DRM encryption setup, see the [DoveRunner Setup Guide](../docs/doverunner-setup.md)**

## Installation Requirements

This tool requires FFmpeg to be installed on your system:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `apt-get install ffmpeg`
- **Windows**: Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

## Python Alternative

If you prefer Python, here's an equivalent script using OpenCV:

```python
import cv2
import numpy as np

# Define video properties
width = 100
height = 100
fps = 1
output_filename = 'stream.mp4'

# Create a white frame (BGR format)
white_color = (255, 255, 255)
frame = np.full((height, width, 3), white_color, dtype=np.uint8)

# Initialize VideoWriter with H.264 codec
fourcc = cv2.VideoWriter_fourcc(*'avc1')
out = cv2.VideoWriter(output_filename, fourcc, fps, (width, height))

# Write the frame
out.write(frame)
out.release()

print(f"Video '{output_filename}' created successfully.")
```

#!/usr/bin/env node

/**
 * DRM Video Generator for Cloakscreen
 *
 * This utility generates a simple solid-color video to be used as the
 * middle layer in the Cloakscreen three-layer protection system.
 *
 * Usage:
 *   node generate-drm-video.js [options]
 *
 * Options:
 *   --width=100         Width of the video in pixels (default: 100)
 *   --height=100        Height of the video in pixels (default: 100)
 *   --color=white       Color of the video (default: white)
 *   --output=stream.mp4 Output filename (default: stream.mp4)
 *   --duration=1        Duration in seconds (default: 1)
 *   --fps=1             Frames per second (default: 1)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let showHelp = false;

const options = {
  width: 1280,
  height: 720,
  color: 'blue',
  output: 'public/dash_assets/source.mp4',
  duration: 35,
  fps: 30,
};

// Parse arguments (support both --key=value and --key value formats)
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  // Handle --key=value format
  const match = arg.match(/^--([^=]+)=(.+)$/);
  if (match) {
    const [, key, value] = match;
    if (key in options) {
      options[key] = isNaN(value) ? value : Number(value);
    }
    continue;
  }

  // Handle --key value format
  switch (arg) {
    case '--help':
    case '-h':
      showHelp = true;
      break;
    case '--width':
      options.width = parseInt(args[++i]);
      break;
    case '--height':
      options.height = parseInt(args[++i]);
      break;
    case '--color':
      options.color = args[++i];
      break;
    case '--duration':
      options.duration = parseInt(args[++i]);
      break;
    case '--fps':
      options.fps = parseInt(args[++i]);
      break;
    case '--output':
      options.output = args[++i];
      break;
  }
}

if (showHelp) {
  console.log('🎬 Cloakscreen DRM Video Generator');
  console.log('=================================');
  console.log('');
  console.log('Usage: node tools/generate-drm-video.js [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  --width WIDTH      Video width in pixels (default: 1280)');
  console.log('  --height HEIGHT    Video height in pixels (default: 720)');
  console.log('  --color COLOR      Background color (default: blue)');
  console.log('  --duration SECS    Video duration in seconds (default: 35)');
  console.log('  --fps FPS          Frame rate (default: 30)');
  console.log('  --output PATH      Output file path (default: public/dash_assets/source.mp4)');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Examples:');
  console.log(
    '  npm run generate-video                              # Generate default 720p video'
  );
  console.log(
    '  node tools/generate-drm-video.js --width 1920 --height 1080  # Generate 1080p video'
  );
  console.log(
    '  node tools/generate-drm-video.js --color red --duration 60   # Red 60-second video'
  );
  console.log('');
  console.log('Integration with DRM:');
  console.log(
    '  npm run generate-drm                               # Auto-generates video if missing'
  );
  process.exit(0);
}

// Ensure output directory exists
const outputDir = path.dirname(options.output);
if (outputDir !== '.' && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a color input for FFmpeg
function generateColorInput(color) {
  // Map common color names to RGB values
  const colorMap = {
    white: 'color=c=white',
    black: 'color=c=black',
    red: 'color=c=red',
    green: 'color=c=green',
    blue: 'color=c=blue',
    yellow: 'color=c=yellow',
    cyan: 'color=c=cyan',
    magenta: 'color=c=magenta',
    gray: 'color=c=gray',
    transparent: 'color=c=black@0.0',
  };

  // Check if color is in the map
  if (color in colorMap) {
    return colorMap[color];
  }

  // Check if it's a hex color
  if (color.startsWith('#')) {
    // Convert hex to RGB
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `color=c=0x${hex}`;
  }

  // Default to white if color not recognized
  console.warn(`Unknown color '${color}', defaulting to white`);
  return 'color=c=white';
}

/**
 * Generate video using FFmpeg
 */
function generateVideo() {
  console.log(`Generating ${options.width}x${options.height} ${options.color} video...`);

  const colorInput = generateColorInput(options.color);
  const outputPath = path.resolve(options.output);

  // FFmpeg command to generate a solid color video
  const ffmpegArgs = [
    '-f',
    'lavfi',
    '-i',
    `${colorInput}:s=${options.width}x${options.height}:r=${options.fps}`,
    '-t',
    options.duration.toString(),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-y',
    outputPath,
  ];

  console.log(`Running FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

  // Check if FFmpeg is installed
  try {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    ffmpeg.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', data => {
      console.error(`${data}`);
    });

    ffmpeg.on('close', code => {
      if (code === 0) {
        console.log('✅ Success! Video saved to: ${outputPath}');
        console.log('\nNext steps to use this video with Cloakscreen:');
        console.log('1. Encrypt this video with DoveRunner CLI Packager');
        console.log('2. Upload the encrypted DASH content to your HTTPS web server');
        console.log('3. Configure your PallyConProvider with the manifest URL');
        console.log('4. Set up license token generation for DRM playback');
        console.log('\n📖 For detailed setup instructions, see: docs/doverunner-setup.md');
      } else {
        console.error(`❌ FFmpeg process exited with code ${code}`);
        console.error('\nMake sure FFmpeg is installed:');
        console.error('- On macOS: brew install ffmpeg');
        console.error('- On Ubuntu/Debian: apt-get install ffmpeg');
        console.error('- On Windows: Download from https://ffmpeg.org/download.html');
      }
    });
  } catch (error) {
    console.error('❌ Error: FFmpeg is not installed or not in PATH');
    console.error('\nPlease install FFmpeg:');
    console.error('- On macOS: brew install ffmpeg');
    console.error('- On Ubuntu/Debian: apt-get install ffmpeg');
    console.error('- On Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
  }
}

/**
 * Generate video using Canvas and MediaRecorder (browser-compatible)
 * This is a fallback if FFmpeg is not available
 */
function generateCanvasVideo() {
  console.error('❌ FFmpeg not found. Canvas-based video generation is not implemented yet.');
  console.error('Please install FFmpeg to generate the DRM video.');
  process.exit(1);
}

// Main execution
console.log('Cloakscreen DRM Video Generator');
console.log('==============================');
console.log(`Settings:
- Width: ${options.width}px
- Height: ${options.height}px
- Color: ${options.color}
- Output: ${options.output}
- Duration: ${options.duration}s
- FPS: ${options.fps}
`);

// Try to generate the video
generateVideo();

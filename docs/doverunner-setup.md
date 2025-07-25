# DoveRunner Multi-DRM Setup Guide for Cloakscreen

This guide walks you through setting up DoveRunner Multi-DRM encryption for your Cloakscreen asset files. DoveRunner (powered by PallyCon) provides the DRM encryption needed for the middle layer video in Cloakscreen's three-layer protection system.

## Overview

Cloakscreen uses a three-layer protection system where the middle layer requires a DRM-encrypted video. This guide covers:

1. Setting up a DoveRunner trial account
2. Packaging your generated video with DoveRunner CLI Packager
3. Generating license tokens for DRM content playback
4. Integrating the encrypted assets with Cloakscreen

## Prerequisites

- A video file generated using `tools/generate-drm-video.js` (see [Tools README](../tools/README.md))
- A web server with HTTPS support for hosting encrypted content
- DoveRunner CLI Packager (downloaded in Step 2)

## Step 1: DoveRunner Trial Account Setup

### 1.1 Sign Up for DoveRunner Trial

1. Go to the [DoveRunner Console login page](https://console.pallycon.com)
2. Click the 'Sign up' button
3. Fill out the registration form and click 'Sign Up'
4. Verify your email address by clicking the 'Verify' button in the welcome email

### 1.2 Get Your DoveRunner Credentials

After email verification:

1. Sign in to the DoveRunner Console
2. Navigate to **Multi-DRM** → **DRM Settings**
3. Copy and save these values (you'll need them later):
   - **Site ID** (4 uppercase letters, e.g., "ABCD")
   - **Site Key** (32-character string)
   - **Access Key** (32-character string)
   - **KMS Token** (from Multi DRM Settings section)

### 1.3 Prepare Your Web Server

You need an HTTPS-enabled web server to host your encrypted content:

- **Cloud options**: AWS S3 + CloudFront, Azure Blob Storage, Google Cloud Storage
- **Free hosting**: Netlify, Vercel, GitHub Pages (with custom domain for HTTPS)
- **Self-hosted**: Ensure SSL certificate is installed

## Step 2: Package Your Video with DoveRunner CLI

### 2.1 Download DoveRunner CLI Packager

1. Go to the [Packager Downloads page](https://console.pallycon.com/download)
2. Download the CLI packager for your OS (Windows/Linux 64-bit)
3. Extract the zip file and copy the executable to your project directory

```bash
# Example directory structure
your-project/
├── DoveRunnerPackager          # CLI executable
├── input/
│   └── stream.mp4             # Your generated video
└── output/
    └── encrypted-stream/      # Will contain encrypted output
```

### 2.2 Package Your Video for DASH-CENC

Use the DoveRunner CLI to encrypt your video:

```bash
# Basic command structure
./DoveRunnerPackager --enc_token YOUR_KMS_TOKEN --content_id YOUR_CONTENT_ID --dash -i INPUT_VIDEO -o OUTPUT_FOLDER

# Example with actual values
./DoveRunnerPackager \
  --enc_token eyJhY2Nlc3Nfa2V5Ijoic05nMmF5UEXRlX2lkIjoiMFROQyJ9 \
  --content_id cloakscreen-shield \
  --dash \
  -i input/stream.mp4 \
  -o output/encrypted-stream/
```

#### Parameter Details

| Parameter      | Description                        | Example                    |
| -------------- | ---------------------------------- | -------------------------- |
| `--enc_token`  | KMS token from DoveRunner console  | `eyJhY2Nlc3Nfa2V5...`      |
| `--content_id` | Unique identifier for your content | `cloakscreen-shield`       |
| `--dash`       | Enable DASH-CENC packaging         | (flag only)                |
| `-i`           | Input video file path              | `input/stream.mp4`         |
| `-o`           | Output directory path              | `output/encrypted-stream/` |

### 2.3 Upload Encrypted Content

After successful packaging:

1. The output folder will contain:
   - `stream.mpd` - DASH manifest file
   - `dash/` folder with encrypted video segments
2. Upload the entire output folder to your HTTPS web server
3. Note the HTTPS URL to your `.mpd` file (e.g., `https://yoursite.com/dash_assets/stream.mpd`)

## Step 3: Generate License Tokens

### 3.1 Using DoveRunner DevConsole (Quick Testing)

For quick testing, use the [Create Token test page](https://sample.pallycon.com/customdata/#createToken):

| Field           | Value                        | Example                                              |
| --------------- | ---------------------------- | ---------------------------------------------------- |
| SITE ID         | Your 4-letter site ID        | `ABCD`                                               |
| SITE Key        | Your 32-character site key   | `3H24FS8wdo3C7CWrSjcIhPYWpYaFu6Lh`                   |
| ACCESS Key      | Your 32-character access key | `gktt7xArRiSrWXEvrommuBdUD6Ktk3cP`                   |
| DRM Type        | Browser-specific DRM         | `Widevine` (Chrome/Firefox)<br>`PlayReady` (Edge/IE) |
| CID             | Your content ID from Step 2  | `cloakscreen-shield`                                 |
| USER ID         | Test user identifier         | `test-user`                                          |
| Time stamp      | Token validity time          | `2024-04-03T08:30:00Z`                               |
| Response Format | License response format      | `original`                                           |
| Key Rotation    | Enable key rotation          | `false`                                              |
| Token Rule      | DRM rules (JSON)             | `{}`                                                 |

### 3.2 Production Token Generation

For production, integrate token generation into your backend using the Cloakscreen server utilities:

```javascript
// Import from the server utilities
const { PallyConTokenGenerator } = require('cloakscreen/server');

const tokenGenerator = new PallyConTokenGenerator({
  siteId: 'YOUR_SITE_ID',
  siteKey: 'YOUR_SITE_KEY',
  accessKey: 'YOUR_ACCESS_KEY',
});

// Generate token for a user
const token = await tokenGenerator.generate({
  contentId: 'cloakscreen-shield',
  userId: 'user123',
  drmType: 'Widevine', // or 'PlayReady'
});
```

## Step 4: Configure Cloakscreen with Encrypted Assets

### 4.1 Update Your Cloakscreen Configuration

```javascript
import Cloakscreen, { Providers } from 'cloakscreen';

// Configure PallyCon provider with your encrypted video
const drmProvider = Providers.PallyCon({
  siteId: 'YOUR_SITE_ID',
  manifestUrl: 'https://yoursite.com/dash_assets/stream.mpd',
  tokenEndpoint: '/api/drm-token', // Your token generation endpoint
  userId: 'current-user-id',
});

// Initialize Cloakscreen
const cloakscreen = new Cloakscreen({
  containerId: 'protected-content',
  drmProvider: drmProvider,
});

// Protect your content
await cloakscreen.protect('Your sensitive content here');
```

### 4.2 Backend Token Endpoint

Create an endpoint to serve DRM tokens:

```javascript
// Express.js example
app.post('/api/drm-token', async (req, res) => {
  try {
    const { userId, contentId } = req.body;

    // Verify user permissions here
    if (!isUserAuthorized(userId, contentId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const token = await tokenGenerator.generate({
      contentId: contentId,
      userId: userId,
      drmType: req.headers['user-agent'].includes('Chrome') ? 'Widevine' : 'PlayReady',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Token generation failed' });
  }
});
```

## Step 5: Testing Your Setup

### 5.1 Verify DRM Content Playback

Test your setup using the [DoveRunner HTML5 Playback Test](https://sample.pallycon.com/html5player/):

1. Enter your DASH manifest URL
2. Enter your generated license token in the `pallycon-customdata-v2` field
3. Click PLAY to verify the video plays correctly

### 5.2 Test Cloakscreen Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/shaka-player@4.11.17/dist/shaka-player.compiled.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/cloakscreen@latest/dist/cloakscreen.min.js"></script>
  </head>
  <body>
    <div id="protected-content"></div>

    <script>
      // Test your configuration
      const drmProvider = Cloakscreen.Providers.PallyCon({
        siteId: 'YOUR_SITE_ID',
        manifestUrl: 'https://yoursite.com/dash_assets/stream.mpd',
        tokenEndpoint: '/api/drm-token',
        userId: 'test-user',
      });

      const cloakscreen = new Cloakscreen({
        containerId: 'protected-content',
        drmProvider: drmProvider,
      });

      cloakscreen.protect('This content is now protected!');
    </script>
  </body>
</html>
```

## Troubleshooting

### Common Issues

**CORS Errors**

- Ensure your web server allows cross-origin requests
- Add appropriate CORS headers for your domain

**DRM Type Mismatch**

- Chrome/Firefox: Use `Widevine`
- Edge/IE11: Use `PlayReady`
- Safari: Use `FairPlay` (requires additional setup)

**Token Expiration**

- Default token validity: 10 minutes (600 seconds)
- Adjust in DoveRunner Console → Site Settings → Integration Settings

**HTTPS Required**

- All DRM content must be served over HTTPS
- Mixed content (HTTP + HTTPS) will fail

### Verification Steps

1. **Check packaging**: Verify `.mpd` file and `dash/` folder exist
2. **Test manifest**: Load manifest URL directly in browser
3. **Validate token**: Use DoveRunner DevConsole to test token generation
4. **Browser compatibility**: Test in Chrome (Widevine) and Edge (PlayReady)

## Production Considerations

### Security Best Practices

- **Never expose credentials**: Keep Site Key and Access Key server-side only
- **Validate users**: Always verify user permissions before generating tokens
- **Rate limiting**: Implement rate limits on token generation endpoints
- **Token expiration**: Use appropriate token validity periods

### Performance Optimization

- **CDN integration**: Use a CDN for encrypted content delivery
- **Caching**: Cache tokens appropriately (but respect expiration)
- **Preloading**: Consider preloading DRM licenses for better UX

### Monitoring

- **Track usage**: Monitor DRM license requests in DoveRunner Console
- **Error logging**: Log DRM-related errors for debugging
- **Analytics**: Track protection effectiveness and user experience

## Next Steps

- [Content Packaging Guide](https://pallycon.com/docs/en/multidrm/packaging/) - Advanced packaging options
- [License Integration Guide](https://pallycon.com/docs/en/multidrm/license/) - Detailed license integration
- [Client Integration Guide](https://pallycon.com/docs/en/multidrm/clients/) - Multi-platform client support
- [Cloakscreen Configuration](./getting-started.md) - Advanced Cloakscreen configuration options

## Support

- **DoveRunner Documentation**: https://pallycon.com/docs/en/multidrm/getting-started/quickstart/
- **Cloakscreen Issues**: [GitHub Issues](https://github.com/cloakscreen/cloakscreen/issues)
- **DoveRunner Support**: Available through DoveRunner Console

# Cloakscreen Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install cloakscreen shaka-player
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp node_modules/cloakscreen/.env.example .env
```

### 3. Configure Your Credentials

#### Universal Environment Variables (All Frameworks)

```bash
# .env (works with Vite, Next.js, Node.js, etc.)
DRM_PROVIDER=pallycon
DRM_SITE_ID=your_site_id_here
DRM_TOKEN_ENDPOINT=/api/get-license-token
```

The library automatically detects these variables in any JavaScript environment.

### 4. Use in Your Code

```typescript
import { protect } from 'cloakscreen';

// Automatically uses environment variables
const cloak = await protect('#content');
```

## Getting Credentials

### PallyCon (Self-Hosted)

1. Sign up at [pallycon.com](https://pallycon.com)
2. Create a new site in your dashboard
3. Copy your Site ID
4. Set up your token endpoint (see server setup below)

### Cloakscreen Cloud (Managed)

1. Sign up at [cloud.cloakscreen.tech](https://cloud.cloakscreen.tech)
2. Get your API key from the dashboard
3. Use cloud provider mode:

```typescript
const cloak = await protect('#content', {
  provider: 'cloud',
  apiKey: 'your_api_key',
});
```

## Server Setup (Self-Hosted)

You need a token endpoint that returns DRM license tokens. Example:

```javascript
// /api/get-license-token
app.post('/api/get-license-token', (req, res) => {
  // Validate request and generate token
  const token = generatePallyConToken({
    siteId: process.env.DRM_SITE_ID,
    contentId: req.body.contentId,
    userId: req.body.userId,
  });

  res.json({ token });
});
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development/staging/production
3. **Rotate API keys regularly**
4. **Validate all requests** on your token endpoint
5. **Use HTTPS** in production

## Troubleshooting

### Missing Site ID Warning

If you see errors about missing siteId in your configuration, it means environment variables aren't loaded:

- Check your `.env` file exists
- Verify variable names match your framework (VITE*, NEXT_PUBLIC*, etc.)
- Restart your development server after adding variables

### DRM Initialization Fails

- Ensure you're using HTTPS (required for DRM)
- Check that Shaka Player is loaded
- Verify your PallyCon credentials are correct
- Check browser console for detailed error messages

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { serverLogger } from './src/shared/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Configuration
const config = {
  provider: {
    name: process.env.DRM_PROVIDER || 'pallycon',
    siteId: process.env.DRM_SITE_ID,
    siteKey: process.env.DRM_SITE_KEY,
    accessKey: process.env.DRM_ACCESS_KEY,
    tokenEndpoint: '/api/get-license-token',
  },
  content: {
    defaultContentId: process.env.CONTENT_ID || 'blank',
    defaultUserId: process.env.DEFAULT_USER_ID || 'demo-user',
  },
  drm: {
    defaultPolicy: {
      policy_version: 2,
      playback_policy: {
        persistent: false,
        license_duration_seconds: 3600,
        playback_duration_seconds: 7200,
      },
    },
  },
};

// Types
interface TokenGeneratorConfig {
  provider: {
    siteId: string;
    siteKey: string;
    accessKey: string;
  };
  content: {
    defaultContentId: string;
    defaultUserId: string;
  };
  drm: {
    defaultPolicy: any;
  };
}

interface TokenGenerateParams {
  contentId?: string;
  userId?: string;
  drmType?: string;
  policy?: any;
}

// Token Generator
class TokenGenerator {
  constructor(private config: TokenGeneratorConfig) {}

  async generate({ contentId, userId, drmType = 'Widevine', policy }: TokenGenerateParams) {
    const cleanContentId = contentId || this.config.content.defaultContentId;
    const cleanUserId = userId || this.config.content.defaultUserId;
    const validatedPolicy = policy || this.config.drm.defaultPolicy;

    const encryptionResult = this.encryptPolicy(validatedPolicy);
    const timestamp = new Date().toISOString().replace(/\.\d{3}/gi, '');
    const hash = this.createAuthHash({
      drmType,
      userId: cleanUserId,
      contentId: cleanContentId,
      policy: encryptionResult.encrypted,
      timestamp,
    });

    const tokenData = {
      drm_type: drmType,
      site_id: this.config.provider.siteId,
      user_id: cleanUserId,
      cid: cleanContentId,
      policy: encryptionResult.encrypted,
      policy_iv: encryptionResult.iv,
      timestamp,
      hash,
      response_format: 'original',
      key_rotation: false,
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  private encryptPolicy(policy: any): { encrypted: string; iv: string } {
    // Generate a random 16-byte IV for each encryption operation
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.config.provider.siteKey,
      iv
    );
    let encrypted = cipher.update(JSON.stringify(policy), 'utf-8', 'base64');
    encrypted += cipher.final('base64');
    
    return {
      encrypted,
      iv: iv.toString('base64')
    };
  }

  private createAuthHash({
    drmType,
    userId,
    contentId,
    policy,
    timestamp,
  }: {
    drmType: string;
    userId: string;
    contentId: string;
    policy: string;
    timestamp: string;
  }) {
    const hashInput = [
      this.config.provider.accessKey,
      drmType,
      this.config.provider.siteId,
      userId,
      contentId,
      policy,
      timestamp,
    ].join('');

    return crypto.createHash('sha256').update(hashInput).digest('base64');
  }
}

const tokenGenerator = new TokenGenerator(config);

// Middleware
app.use(cors());
app.use(express.json());

// Serve built library files
app.use('/dist', express.static('dist'));
app.use('/cloakscreen.min.js', express.static('dist/cloakscreen.min.js'));
app.use('/index.esm.js', express.static('dist/index.esm.js'));

// Ensure the specific file is served correctly
app.get('/dist/index.esm.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.esm.js'));
});

// API Routes
app.get('/api/token/info', (req, res) => {
  res.json({
    success: true,
    info: {
      provider: config.provider.name,
      siteId: config.provider.siteId,
      tokenEndpoint: config.provider.tokenEndpoint,
    },
  });
});

app.post('/api/get-license-token', async (req, res) => {
  try {
    const {
      contentId = config.content.defaultContentId,
      userId = config.content.defaultUserId,
      drmType = 'Widevine',
    } = req.body;

    const token = await tokenGenerator.generate({ contentId, userId, drmType });

    res.json({
      success: true,
      token,
      metadata: {
        contentId,
        userId,
        drmType,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: 'Token generation failed',
      message: errorMessage,
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  serverLogger.info(`🔧 API Server: http://localhost:${port}`);
});

export default app;

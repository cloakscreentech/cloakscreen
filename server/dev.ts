/**
 * Development Server
 * 
 * Combines API server with static file serving for development.
 * Separated from production API concerns.
 */

import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apiApp from './api.js';
import { serverLogger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Mount API routes
app.use(apiApp);

// Serve built library files for development
app.use('/dist', express.static(path.join(__dirname, '../dist')));
app.use('/cloakscreen.min.js', express.static(path.join(__dirname, '../dist/cloakscreen.min.js')));
app.use('/index.esm.js', express.static(path.join(__dirname, '../dist/index.esm.js')));

// Ensure the specific file is served correctly
app.get('/dist/index.esm.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.esm.js'));
});

// Create HTTPS server with self-signed certificate
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

https.createServer(httpsOptions, app).listen(port, '0.0.0.0', () => {
  serverLogger.info(`🔧 Development Server: https://0.0.0.0:${port}`);
  serverLogger.info('📁 Serving static files from /dist');
  serverLogger.info('🔌 API endpoints available at /api/*');
  serverLogger.info('🔒 HTTPS enabled with self-signed certificate');
});

export default app;
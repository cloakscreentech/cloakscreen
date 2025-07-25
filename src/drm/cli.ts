#!/usr/bin/env node

/**
 * Cloakscreen DRM Content Generation CLI
 *
 * Command-line interface for generating and encrypting DRM content
 */

import { program } from 'commander';
import path from 'path';
import { DRMWorkflow } from './DRMWorkflow';
import { VideoGenerationOptions, DRMWorkflowOptions } from './types';
import { providerRegistry } from '../providers/base/ProviderRegistry';
import { createLogger } from '../utils/logger';

// CLI version
const CLI_VERSION = '1.0.0';
const logger = createLogger('CLI');

program
  .name('cloakscreen-drm')
  .description('Generate and encrypt DRM content for Cloakscreen protection')
  .version(CLI_VERSION);

// Generate command
program
  .command('generate')
  .description('Generate and encrypt DRM content')
  .option('-p, --provider <provider>', 'DRM provider (pallycon, axinom, ezdrm)', 'pallycon')
  .option('-o, --output <dir>', 'Output directory', './drm-content')
  .option('-s, --size <size>', 'Video size (WxH)', '100x100')
  .option('-c, --color <color>', 'Video color', 'white')
  .option('-d, --duration <seconds>', 'Video duration in seconds', '1')
  .option('-f, --fps <fps>', 'Frames per second', '1')
  .option('--format <format>', 'Video format (mp4, webm)', 'mp4')
  .option('--codec <codec>', 'Video codec (h264, h265, vp9)', 'h264')
  .option('--bitrate <kbps>', 'Video bitrate in kbps', '100')
  .option('--content-id <id>', 'Custom content ID')
  .option('--no-validate', 'Skip encryption validation')
  .option('--no-cleanup', 'Keep temporary files')
  .option('--responsive', 'Generate multiple sizes for responsive design')
  .option('--config <file>', 'Provider configuration file')
  .action(async options => {
    try {
      await generateDRMContent(options);
    } catch (error) {
      logger.error('Generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// List providers command
program
  .command('providers')
  .description('List available DRM providers')
  .action(async () => {
    try {
      await listProviders();
    } catch (error) {
      logger.error('Failed to list providers:', error);
      process.exit(1);
    }
  });

// Check dependencies command
program
  .command('check')
  .description('Check if required dependencies are installed')
  .option('-p, --provider <provider>', 'Check specific provider', 'all')
  .action(async options => {
    try {
      await checkDependencies(options.provider);
    } catch (error) {
      logger.error('Dependency check failed:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <manifest>')
  .description('Validate encrypted DRM content')
  .option('-p, --provider <provider>', 'DRM provider used for encryption', 'pallycon')
  .action(async (manifestPath, options) => {
    try {
      await validateDRMContent(manifestPath, options.provider);
    } catch (error) {
      logger.error('Validation failed:', error);
      process.exit(1);
    }
  });

/**
 * Generate DRM content
 */
async function generateDRMContent(options: any): Promise<void> {
  logger.info('🎬 Cloakscreen DRM Content Generator');
  logger.info('=====================================');

  // Parse video size
  const [width, height] = options.size.split('x').map(Number);
  if (!width || !height) {
    throw new Error('Invalid size format. Use WxH (e.g., 100x100)');
  }

  // Load provider configuration
  const providerConfig = options.config ? await loadProviderConfig(options.config) : {};

  // Create video generation options
  const videoOptions: VideoGenerationOptions = {
    width,
    height,
    color: options.color,
    duration: parseFloat(options.duration),
    fps: parseInt(options.fps),
    format: options.format,
    codec: options.codec,
    bitrate: parseInt(options.bitrate),
  };

  // Create workflow options
  const workflowOptions: DRMWorkflowOptions = {
    provider: options.provider,
    videoOptions,
    outputDir: path.resolve(options.output),
    contentId: options.contentId,
    validate: options.validate,
    cleanup: options.cleanup,
    providerConfig,
  };

  logger.info(`📋 Configuration:
  Provider: ${options.provider}
  Size: ${width}x${height}
  Color: ${options.color}
  Duration: ${options.duration}s
  Output: ${workflowOptions.outputDir}
`);

  // Create workflow
  const workflow = new DRMWorkflow(options.provider, providerConfig);

  // Check dependencies
  const deps = await workflow.checkDependencies();
  if (!deps.available) {
    logger.error('❌ Missing dependencies:', deps.missing.join(', '));
    logger.info('\n📖 Setup instructions:');
    workflow.getSetupInstructions().forEach(instruction => {
      logger.info(`  ${instruction}`);
    });
    throw new Error('Please install missing dependencies and try again');
  }

  // Generate responsive variants or single video
  if (options.responsive) {
    logger.info('📱 Generating responsive variants...');
    const results = await workflow.generateResponsiveVariants(workflowOptions);

    logger.info('\n✅ Generated responsive DRM content:');
    results.forEach((result, index) => {
      const sizes = ['small (100x100)', 'medium (200x200)', 'large (400x400)'];
      logger.info(`  ${sizes[index]}: ${result.manifestPath}`);
    });
  } else {
    logger.info('🔐 Generating DRM content...');
    const result = await workflow.execute(workflowOptions);

    if (result.success) {
      logger.info('\n✅ DRM content generated successfully!');
      logger.info(`📁 Output directory: ${result.outputPath}`);
      logger.info(`📄 Manifest file: ${result.manifestPath}`);
      logger.info(`🔑 Content ID: ${result.metadata.contentId}`);
      logger.info(`🆔 Key ID: ${result.metadata.keyId}`);

      if (result.warnings && result.warnings.length > 0) {
        logger.warn('\n⚠️  Warnings:');
        result.warnings.forEach(warning => logger.warn(`  • ${warning}`));
      }
    } else {
      throw new Error(`DRM generation failed: ${result.errors?.join(', ')}`);
    }
  }

  logger.info('\n🎯 Next steps:');
  logger.info('1. Upload the encrypted content to your HTTPS web server');
  logger.info('2. Configure your Cloakscreen provider to use the manifest URL');
  logger.info('3. Test the protection in your application');
}

/**
 * List available providers
 */
async function listProviders(): Promise<void> {
  logger.info('📋 Available DRM Providers:');
  logger.info('===========================');

  const providers = providerRegistry.getAvailable();

  if (providers.length === 0) {
    logger.info('No providers registered.');
    return;
  }

  for (const providerName of providers) {
    const metadata = providerRegistry.getMetadata(providerName);
    const isSupported = await providerRegistry.isSupported(providerName);

    logger.info(`\n📦 ${metadata?.displayName || providerName}`);
    logger.info(`   Name: ${providerName}`);
    logger.info(
      `   Status: ${isSupported ? '✅ Supported' : '❌ Not supported in this environment'}`
    );
    logger.info(`   Key Systems: ${metadata?.supportedKeySystems.join(', ') || 'Unknown'}`);
    logger.info(`   Pricing: Commercial`);

    logger.info(`   Homepage: https://pallycon.com`);
  }
}

/**
 * Check dependencies for providers
 */
async function checkDependencies(provider: string): Promise<void> {
  logger.info('🔍 Checking Dependencies:');
  logger.info('=========================');

  if (provider === 'all') {
    const providers = providerRegistry.getAvailable();

    for (const providerName of providers) {
      await checkSingleProvider(providerName);
    }
  } else {
    await checkSingleProvider(provider);
  }
}

/**
 * Check dependencies for a single provider
 */
async function checkSingleProvider(providerName: string): Promise<void> {
  try {
    const workflow = new DRMWorkflow(providerName);
    const deps = await workflow.checkDependencies();

    logger.info(`\n📦 ${providerName}:`);

    if (deps.available) {
      logger.info('   ✅ All dependencies available');
    } else {
      logger.info('   ❌ Missing dependencies:');
      deps.missing.forEach(dep => logger.info(`      • ${dep}`));

      logger.info('\n   📖 Setup instructions:');
      workflow.getSetupInstructions().forEach(instruction => {
        logger.info(`      ${instruction}`);
      });
    }
  } catch (error) {
    logger.info(`\n📦 ${providerName}:`);
    logger.info(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Validate DRM content
 */
async function validateDRMContent(manifestPath: string, provider: string): Promise<void> {
  logger.info('🔍 Validating DRM Content:');
  logger.info('===========================');

  const workflow = new DRMWorkflow(provider);
  const result = await workflow.validateEncryption(path.resolve(manifestPath));

  logger.info(`📄 Manifest: ${manifestPath}`);
  logger.info(`📦 Provider: ${provider}`);
  logger.info(`✅ Valid: ${result.valid ? 'Yes' : 'No'}`);

  if (result.errors.length > 0) {
    logger.info('\n❌ Errors:');
    result.errors.forEach(error => logger.info(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    logger.info('\n⚠️  Warnings:');
    result.warnings.forEach(warning => logger.info(`  • ${warning}`));
  }

  if (result.playbackTest) {
    logger.info('\n🎮 Playback Test:');
    logger.info(`  Can Load: ${result.playbackTest.canLoad ? 'Yes' : 'No'}`);
    logger.info(`  Can Play: ${result.playbackTest.canPlay ? 'Yes' : 'No'}`);
    logger.info(`  DRM Active: ${result.playbackTest.drmActive ? 'Yes' : 'No'}`);

    if (result.playbackTest.errorMessage) {
      logger.info(`  Note: ${result.playbackTest.errorMessage}`);
    }
  }
}

/**
 * Load provider configuration from file
 */
async function loadProviderConfig(configPath: string): Promise<any> {
  try {
    const fs = await import('fs/promises');
    const configContent = await fs.readFile(path.resolve(configPath), 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Failed to load configuration file: ${error}`);
  }
}

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

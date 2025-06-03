#!/usr/bin/env node

/**
 * SVG to PNG Converter
 *
 * Convert SVG files to PNG format with customizable styling and dimensions.
 * Features:
 * - Configuration validation
 * - Enhanced error handling and logging
 * - Performance optimizations with caching and parallel processing
 * - Support for both local files and remote URLs
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import yaml from 'js-yaml';
import { URL } from 'url';

// Constants
const DEFAULT_CONFIG = 'config.yml';
const SVG_SHAPE_SELECTORS =
  'path, circle, rect, ellipse, line, polyline, polygon';
const TRANSPARENT_BACKGROUND = { r: 0, g: 0, b: 0, alpha: 0 };
const DEFAULT_STROKE_WIDTH = '1.5';

/**
 * Enhanced logging utility with different levels
 */
class Logger {
  static levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  static currentLevel = Logger.levels.INFO;

  static error(message, ...args) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`⚠️  WARN: ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  static success(message, ...args) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  static debug(message, ...args) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`🐛 DEBUG: ${message}`, ...args);
    }
  }

  static progress(current, total, item) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`[${current}/${total}] Processing ${item}...`);
    }
  }
}

/**
 * Configuration validation and management
 */
class ConfigManager {
  static validateConfig(config) {
    const errors = [];

    // Validate each section separately to reduce complexity
    errors.push(...this.validateIcons(config.icons));
    errors.push(...this.validateSources(config.sources));
    errors.push(...this.validateSettings(config.settings));

    return errors;
  }

  static validateIcons(icons) {
    if (!icons || !Array.isArray(icons) || icons.length === 0) {
      return ['icons: must be a non-empty array'];
    }
    return [];
  }

  static validateSources(sources) {
    const errors = [];

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      errors.push('sources: must be a non-empty array');
      return errors;
    }

    sources.forEach((source, index) => {
      errors.push(...this.validateSingleSource(source, index));
    });

    return errors;
  }

  static validateSingleSource(source, index) {
    const errors = [];

    if (!source.source || typeof source.source !== 'string') {
      errors.push(`sources[${index}].source: must be a non-empty string`);
    }
    if (!source.suffix || typeof source.suffix !== 'string') {
      errors.push(`sources[${index}].suffix: must be a non-empty string`);
    }

    return errors;
  }

  static validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return ['settings: must be an object'];
    }

    const errors = [];
    errors.push(...this.validateBasicSettings(settings));
    errors.push(...this.validateWideSettings(settings.wide));

    return errors;
  }

  static validateBasicSettings(settings) {
    const errors = [];

    if (
      typeof settings.size !== 'number' ||
      settings.size < 1 ||
      settings.size > 2048
    ) {
      errors.push('settings.size: must be a number between 1 and 2048');
    }

    if (
      !settings.outputDirectory ||
      typeof settings.outputDirectory !== 'string'
    ) {
      errors.push('settings.outputDirectory: must be a non-empty string');
    }

    return errors;
  }

  static validateWideSettings(wide) {
    if (!wide) {
      return [];
    }

    const errors = [];

    if (typeof wide.width !== 'number' || wide.width < 1) {
      errors.push('settings.wide.width: must be a positive number');
    }
    if (typeof wide.height !== 'number' || wide.height < 1) {
      errors.push('settings.wide.height: must be a positive number');
    }
    if (typeof wide.iconSize !== 'number' || wide.iconSize < 1) {
      errors.push('settings.wide.iconSize: must be a positive number');
    }
    if (wide.iconSize > Math.min(wide.width, wide.height)) {
      errors.push('settings.wide.iconSize: must be <= min(width, height)');
    }

    return errors;
  }

  static async loadConfig(configPath = DEFAULT_CONFIG) {
    try {
      const resolvedPath = path.resolve(configPath);
      Logger.info(`Loading configuration from: ${resolvedPath}`);

      const configContent = await fs.readFile(resolvedPath, 'utf8');
      const config = yaml.load(configContent);

      const validationErrors = this.validateConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(
          `Configuration validation failed:\n${validationErrors.join('\n')}`
        );
      }

      Logger.success('Configuration loaded and validated successfully');
      return config;
    } catch (error) {
      Logger.error(
        `Failed to load configuration from ${configPath}:`,
        error.message
      );
      throw error;
    }
  }
}

/**
 * Enhanced argument parser with validation
 */
class ArgumentParser {
  static parse() {
    const args = process.argv.slice(2);
    const options = {
      configFile: DEFAULT_CONFIG,
      verbose: false,
      parallel: false,
      help: false,
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      switch (arg) {
        case '--config':
        case '-c':
          if (i + 1 >= args.length) {
            throw new Error('--config option requires a file path');
          }
          options.configFile = args[i + 1];
          i += 2; // Skip both the flag and its value
          break;

        case '--verbose':
        case '-v':
          options.verbose = true;
          Logger.currentLevel = Logger.levels.DEBUG;
          i += 1;
          break;

        case '--parallel':
        case '-p':
          options.parallel = true;
          i += 1;
          break;

        case '--help':
        case '-h':
          options.help = true;
          i += 1;
          break;

        default:
          throw new Error(`Unknown option: ${arg}`);
      }
    }

    if (options.help) {
      this.showHelp();
      process.exit(0);
    }

    return options;
  }
  static showHelp() {
    console.log(`
SVG to PNG Converter

Usage: node svg2png.js [options]

Options:
  -c, --config <file>    Configuration file to use (default: config.yml)
  -v, --verbose         Enable verbose logging
  -p, --parallel        Enable parallel processing
  -h, --help           Show this help message

Examples:
  node svg2png.js                              # Use default config
  node svg2png.js --config custom.yml         # Custom config
  node svg2png.js --config config.yml --verbose # With verbose logging
  node svg2png.js --parallel                   # Parallel processing
`);
  }
}

/**
 * Utility functions
 */
class Utils {
  static isUrl(source) {
    try {
      new URL(source);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  }

  static formatBytes(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      Logger.debug(`Directory ensured: ${dirPath}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        Logger.warn(`Could not create directory ${dirPath}:`, error.message);
        throw error;
      }
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Modern SVG processor with enhanced features
 */
class SVGProcessor {
  constructor() {
    this.cache = new Map();
  }

  async fetchContent(source, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(source)) {
      Logger.debug(`Cache hit for: ${source}`);
      return this.cache.get(source);
    }

    try {
      let content;
      if (Utils.isUrl(source)) {
        Logger.debug(`Fetching from URL: ${source}`);
        const response = await fetch(source);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        content = await response.text();
      } else {
        Logger.debug(`Reading local file: ${source}`);

        if (!(await Utils.fileExists(source))) {
          throw new Error(`File not found: ${source}`);
        }

        content = await fs.readFile(source, 'utf8');
      }

      // Cache the content
      if (useCache) {
        this.cache.set(source, content);
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to fetch SVG from ${source}: ${error.message}`);
    }
  }

  modifyContent(svgContent, { color, width, height } = {}) {
    try {
      const dom = new JSDOM(svgContent, { contentType: 'text/xml' });
      const document = dom.window.document;
      const svgElement = document.querySelector('svg');

      if (!svgElement) {
        throw new Error('No SVG element found in content');
      }

      // Apply dimensions
      if (width) {
        svgElement.setAttribute('width', String(width));
      }
      if (height) {
        svgElement.setAttribute('height', String(height));
      }

      // Apply color styling
      if (color) {
        this.applyColorStyling(svgElement, color);
      }

      return svgElement.outerHTML;
    } catch (error) {
      throw new Error(`SVG modification failed: ${error.message}`);
    }
  }

  applyColorStyling(svgElement, color) {
    const paths = svgElement.querySelectorAll('path');
    const isOutlineIcon = Array.from(paths).some(
      path =>
        path.getAttribute('stroke') !== null ||
        path.getAttribute('fill') === 'none' ||
        !path.getAttribute('fill')
    );

    // Clean existing attributes
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(element => {
      element.removeAttribute('fill');
      element.removeAttribute('stroke');
      element.removeAttribute('stroke-width');
    });

    const shapeElements = svgElement.querySelectorAll(SVG_SHAPE_SELECTORS);

    if (isOutlineIcon) {
      // Outline style: stroke only, no fill
      svgElement.setAttribute('stroke', color);
      svgElement.setAttribute('fill', 'none');
      svgElement.setAttribute('stroke-width', DEFAULT_STROKE_WIDTH);

      shapeElements.forEach(element => {
        element.setAttribute('stroke', color);
        element.setAttribute('fill', 'none');
        if (!element.getAttribute('stroke-width')) {
          element.setAttribute('stroke-width', DEFAULT_STROKE_WIDTH);
        }
      });
    } else {
      // Solid style: fill only
      svgElement.setAttribute('fill', color);
      shapeElements.forEach(element => {
        element.setAttribute('fill', color);
      });
    }
  }
}

/**
 * Enhanced PNG converter with performance optimizations
 */
class PNGConverter {
  constructor() {
    this.processor = new SVGProcessor();
  }

  async convertSquare(source, options = {}) {
    const { output = 'output.png', size = 24, color = null } = options;

    try {
      Logger.debug(`Converting square PNG: ${source} -> ${output}`);

      const svgContent = await this.processor.fetchContent(source);
      const modifiedSVG = this.processor.modifyContent(svgContent, {
        color,
        width: size,
        height: size,
      });

      const pngBuffer = await sharp(Buffer.from(modifiedSVG))
        .resize(size, size, {
          fit: 'contain',
          background: TRANSPARENT_BACKGROUND,
        })
        .png()
        .toBuffer();

      await fs.writeFile(output, pngBuffer);

      const fileSize = Utils.formatBytes(pngBuffer.length);
      Logger.debug(`Square PNG saved: ${output} (${fileSize})`);

      return { success: true, output, size: pngBuffer.length };
    } catch (error) {
      Logger.error(`Square conversion failed for ${source}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async convertWide(source, options = {}) {
    const {
      output = 'output_wide.png',
      width = 320,
      height = 180,
      iconSize = 80,
      color = null,
    } = options;

    try {
      Logger.debug(`Converting wide PNG: ${source} -> ${output}`);

      const svgContent = await this.processor.fetchContent(source);
      const modifiedSVG = this.processor.modifyContent(svgContent, {
        color,
        width: iconSize,
        height: iconSize,
      });

      // Create icon buffer
      const iconBuffer = await sharp(Buffer.from(modifiedSVG))
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: TRANSPARENT_BACKGROUND,
        })
        .png()
        .toBuffer();

      // Calculate center position
      const left = Math.round((width - iconSize) / 2);
      const top = Math.round((height - iconSize) / 2);

      // Create wide PNG with centered icon
      const widePngBuffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: TRANSPARENT_BACKGROUND,
        },
      })
        .composite([{ input: iconBuffer, left, top }])
        .png()
        .toBuffer();

      await fs.writeFile(output, widePngBuffer);

      const fileSize = Utils.formatBytes(widePngBuffer.length);
      Logger.debug(`Wide PNG saved: ${output} (${fileSize})`);

      return { success: true, output, size: widePngBuffer.length };
    } catch (error) {
      Logger.error(`Wide conversion failed for ${source}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Main converter with enhanced features
 */
class SVGConverter {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;
    this.converter = new PNGConverter();
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      totalSize: 0,
      startTime: Date.now(),
    };
  }

  async run() {
    const { icons, settings, sources } = this.config;
    const { size, color, wide, outputDirectory } = settings;

    // Ensure output directory exists
    await Utils.ensureDirectory(outputDirectory);

    // Calculate dimensions
    const wideWidth = wide?.width || 320;
    const wideHeight = wide?.height || 180;
    const wideIconSize = wide?.iconSize || size;
    const wideSuffix = wide?.wideSuffix || '_wide';

    this.logInitialization(icons, sources, settings);

    const tasks = this.generateTasks(icons, sources, {
      size,
      color,
      outputDirectory,
      wideWidth,
      wideHeight,
      wideIconSize,
      wideSuffix,
    });

    this.stats.total = tasks.length;

    if (this.options.parallel) {
      await this.runParallel(tasks);
    } else {
      await this.runSequential(tasks);
    }

    this.logSummary();
  }

  generateTasks(icons, sources, settings) {
    const tasks = [];

    for (const iconName of icons) {
      for (const sourceConfig of sources) {
        const { source, suffix } = sourceConfig;
        const baseName = iconName.replace('.svg', '');

        // Build full source path
        const fullSource = Utils.isUrl(source)
          ? source + iconName
          : path.join(source, iconName);

        // Generate file paths
        const squareOutput = path.join(
          settings.outputDirectory,
          `${baseName}${suffix}.png`
        );
        const wideOutput = path.join(
          settings.outputDirectory,
          `${baseName}${suffix}${settings.wideSuffix}.png`
        );

        tasks.push(
          {
            type: 'square',
            source: fullSource,
            output: squareOutput,
            iconName,
            suffix,
            options: { size: settings.size, color: settings.color },
          },
          {
            type: 'wide',
            source: fullSource,
            output: wideOutput,
            iconName,
            suffix,
            options: {
              width: settings.wideWidth,
              height: settings.wideHeight,
              iconSize: settings.wideIconSize,
              color: settings.color,
            },
          }
        );
      }
    }

    return tasks;
  }

  async runSequential(tasks) {
    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i];
      Logger.progress(i + 1, tasks.length, `${task.iconName} (${task.type})`);

      const result = await this.executeTask(task);
      this.updateStats(result);
    }
  }

  async runParallel(tasks) {
    Logger.info('Running in parallel mode...');

    const BATCH_SIZE = 4; // Process in batches to avoid overwhelming the system

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      Logger.info(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          tasks.length / BATCH_SIZE
        )}`
      );

      const results = await Promise.allSettled(
        batch.map(task => this.executeTask(task))
      );
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          this.updateStats(result.value);
        } else {
          this.stats.failed += 1;
          Logger.error('Task failed:', result.reason);
        }
      });
    }
  }

  async executeTask(task) {
    const { type, source, output, options } = task;

    if (type === 'square') {
      return await this.converter.convertSquare(source, { ...options, output });
    } else {
      return await this.converter.convertWide(source, { ...options, output });
    }
  }
  updateStats(result) {
    if (result.success) {
      this.stats.successful += 1;
      this.stats.totalSize += result.size || 0;
    } else {
      this.stats.failed += 1;
    }
  }

  logInitialization(icons, sources, settings) {
    const sourceTypes = sources.map(s => s.source);
    const hasLocal = sourceTypes.some(s => !Utils.isUrl(s));
    const hasRemote = sourceTypes.some(s => Utils.isUrl(s));

    let sourceType = 'mixed sources';
    if (hasLocal && !hasRemote) {
      sourceType = 'local directories';
    }
    if (!hasLocal && hasRemote) {
      sourceType = 'remote URLs';
    }

    Logger.info(
      `🚀 Starting conversion of ${icons.length} SVG files from ${sourceType} in ${sources.length} styles`
    );
    Logger.info(`📏 Square: ${settings.size}x${settings.size}px`);
    Logger.info(
      `📏 Wide: ${settings.wide?.width || 320}x${
        settings.wide?.height || 180
      }px`
    );
    Logger.info(`🎨 Color: ${settings.color || 'original'}`);
    Logger.info(`📁 Output: ${settings.outputDirectory}/`);

    if (this.options.parallel) {
      Logger.info('⚡ Parallel processing enabled');
    }

    console.log('');
  }

  logSummary() {
    const elapsed = Date.now() - this.stats.startTime;
    const elapsedSeconds = (elapsed / 1000).toFixed(2);

    Logger.info('🎉 Conversion completed!');
    Logger.info(
      `📊 Results: ${this.stats.successful} successful, ${this.stats.failed} failed`
    );
    Logger.info(`📁 Total files: ${this.stats.successful}`);
    Logger.info(`💾 Total size: ${Utils.formatBytes(this.stats.totalSize)}`);
    Logger.info(`⏱️  Duration: ${elapsedSeconds}s`);

    if (this.stats.failed > 0) {
      Logger.warn(
        `⚠️  ${this.stats.failed} conversions failed - check logs above`
      );
    }
  }
}

/**
 * Check Node.js version compatibility
 */
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  const REQUIRED_NODE_VERSION = 18;

  if (majorVersion < REQUIRED_NODE_VERSION) {
    console.error(
      `❌ ERROR: Node.js ${REQUIRED_NODE_VERSION}+ is required for native fetch support.`
    );
    console.error(`   Current version: ${nodeVersion}`);
    console.error('   Please upgrade Node.js: https://nodejs.org/');
    process.exit(1);
  }

  // Optional: Show a warning for very old supported versions
  if (majorVersion === 18) {
    console.warn(
      `⚠️  Note: You're using Node.js ${nodeVersion}. Consider upgrading to the latest LTS version.`
    );
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = ArgumentParser.parse();
    const config = await ConfigManager.loadConfig(options.configFile);

    const converter = new SVGConverter(config, options);
    await converter.run();
  } catch (error) {
    Logger.error('Application failed:', error.message);
    if (error.stack && Logger.currentLevel >= Logger.levels.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', reason => {
  Logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  Logger.error('Uncaught Exception:', error.message);
  process.exit(1);
});

// Check Node.js version compatibility first
checkNodeVersion();

// Run the application
main();

export { SVGConverter, ConfigManager, Logger, Utils };

# SVG to PNG Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![GitHub issues](https://img.shields.io/github/issues/sebastian2010/svg2png)](https://github.com/sebastian2010/svg2png/issues)
[![GitHub stars](https://img.shields.io/github/stars/sebastian2010/svg2png)](https://github.com/sebastian2010/svg2png/stargazers)

A modern Node.js tool for converting SVG files to PNG format with support for both remote URLs and local directories.

## Features

- **ES Modules Support**: Modern JavaScript module system
- **Performance**: Optional parallel processing for faster batch conversions
- **Caching**: SVG content caching to avoid re-downloading
- **Enhanced Logging**: Configurable logging levels with detailed progress tracking
- **Configuration Validation**: Comprehensive validation with helpful error messages
- **Multiple Sources**: Convert from URLs or local directories
- **Dual Format Output**: Generate both square and wide (16:9) format PNGs
- **Custom Styling**: Apply colors and handle different icon styles (outline, solid)
- **Batch Processing**: Process multiple icons simultaneously
- **Smart Detection**: Automatic outline vs solid icon detection
- **Transparent Backgrounds**: Clean PNG output with transparency
- **Node.js 18+ Required**: Uses native fetch API for better performance

## Requirements

- **Node.js 18+** (for native fetch API support)
- NPM (comes with Node.js)

## Installation

### Clone from GitHub

```bash
git clone https://github.com/sebastian2010/svg2png.git
cd svg2png
npm install
```

### Direct Installation

```bash
npm install
```

**Note**: The output directory will be created automatically if it doesn't exist.

## Usage

## Usage

### Basic Usage

```bash
# Using npm script (recommended)
npm run convert

# Use predefined configurations
npm run convert:local      # Use config-local-sample.yml
npm run convert:url        # Use config-url-sample.yml

# Or run directly with Node.js
node svg2png.js

# Use a custom configuration file
node svg2png.js --config custom-config.yml
node svg2png.js -c config-local-sample.yml

# Enable verbose logging for debugging
node svg2png.js --verbose
node svg2png.js -v

# Enable parallel processing for faster conversion
node svg2png.js --parallel
node svg2png.js -p

# Combine options
node svg2png.js --config custom.yml --verbose --parallel

# Show help and available options
node svg2png.js --help
```

### Command Line Options

- `-c, --config <file>` - Specify a configuration file (default: config.yml)
- `-v, --verbose` - Enable verbose logging with detailed debug information
- `-p, --parallel` - Enable parallel processing for faster batch conversion
- `-h, --help` - Show help message and available options

### Available npm Scripts

- `npm run convert` - Run with default config.yml
- `npm run convert:local` - Run with config-local-sample.yml
- `npm run convert:url` - Run with config-url-sample.yml
- `npm run convert:verbose` - Run with verbose logging enabled
- `npm run convert:parallel` - Run with parallel processing enabled

### What It Does

The converter will:

- **Validate Configuration**: Check all settings before starting conversion
- **Process SVG Files**: From configured sources (URLs or local directories)
- **Generate Square PNGs**: Standard format (configurable size, default 80x80px)
- **Generate Wide PNGs**: 16:9 aspect ratio format (default 320x180px) with centered icons
- **Apply Custom Styling**: Colors, stroke widths, and style detection
- **Provide Detailed Feedback**: Progress tracking, file sizes, and performance statistics
- **Cache Content**: Avoid re-downloading the same SVG files
- **Save Results**: All files to the specified output directory with organized naming

### Performance Features

- **Parallel Processing**: Use `--parallel` to process multiple files simultaneously
- **Smart Caching**: SVG content is cached to avoid redundant downloads
- **Batch Operations**: Efficient processing of large icon sets
- **Progress Tracking**: Real-time progress with file counts and timing
- **Memory Efficient**: Processes files in batches to avoid memory overflow

### Configuration

The converter uses a YAML configuration file (`config.yml`) to customize the conversion process.

#### Sample Configurations

Two sample configuration files are provided:

- **`config-url-sample.yml`** - For downloading SVG files from remote URLs
- **`config-local-sample.yml`** - For processing SVG files from local directories

Copy one of these to `config.yml` and modify as needed.

#### Configuration Structure

```yaml
# List of SVG files to process
icons:
  - computer-desktop.svg
  - exclamation-circle.svg
  - bug-ant.svg
  # ... add more icons as needed

# Sources for different icon styles (can be URLs or local directories)
# Each source includes both the path/URL and the suffix for output files
sources:
  - source: "https://example.com/icons/outline/"
    suffix: "_outline"
  - source: "https://example.com/icons/solid/"
    suffix: "_solid"
  # For local directories, use paths like:
  # - source: "./icons/outline"
  #   suffix: "_outline"
  # - source: "./icons/solid"
  #   suffix: "_solid"

# Settings for conversion
settings:
  size: 80 # Size for square icons (pixels)
  color: "#075db3" # Color to apply (hex, named colors, rgb)
  outputDirectory: "dist" # Output folder  # Wide format settings (16:9 aspect ratio)
  wide:
    width: 320 # Width of wide format
    height: 180 # Height of wide format
    iconSize: 160 # Size of icon in wide format (must be <= min(width, height))
    wideSuffix: "_wide" # Suffix to append to wide format filenames
```

You can customize:

- **Icons list**: Add or remove icons from the `icons` array
- **Sources**: Add or remove icon sources with their corresponding suffixes
- **Colors**: Change the `color` setting (supports hex, named colors, rgb)
- **Sizes**: Modify `size` for square icons or `iconSize` for wide format icons
- **Wide format dimensions**: Change `width` and `height` for wide format containers
- **Wide suffix**: Customize the `wideSuffix` for wide format filenames (default: "\_wide")
- **Output directory**: Change where files are saved

**Note**: The `iconSize` must be less than or equal to the minimum of `width` and `height` to fit properly within the wide format container.

### Example Output

When you run the converter, you'll see detailed progress information:

```
ℹ️  Loading configuration from: C:\path\to\config.yml
✅ Configuration loaded and validated successfully
ℹ️  🚀 Starting conversion of 12 SVG files from remote URLs in 2 styles
ℹ️  📏 Square: 80x80px
ℹ️  📏 Wide: 320x180px
ℹ️  🎨 Color: #075db3
ℹ️  📁 Output: dist/
ℹ️  ⚡ Parallel processing enabled

ℹ️  Running in parallel mode...
ℹ️  Processing batch 1/12
ℹ️  Processing batch 2/12
...
ℹ️  🎉 Conversion completed!
ℹ️  📊 Results: 48 successful, 0 failed
ℹ️  📁 Total files: 48
ℹ️  💾 Total size: 146.03 KB
ℹ️  ⏱️  Duration: 0.83s
```

## Examples

### Command Line Usage Examples

```bash
# Basic conversion with default settings
node svg2png.js

# Use verbose logging to see detailed process
node svg2png.js --verbose

# Use parallel processing for faster conversion
node svg2png.js --parallel

# Use a specific configuration file
node svg2png.js --config my-project-config.yml

# Combine all options for maximum performance and visibility
node svg2png.js --config my-config.yml --verbose --parallel

# Quick start with sample configurations
npm run convert:url        # Download from remote URLs (heroicons)
npm run convert:local      # Process from local directories
npm run convert:verbose    # With detailed logging
npm run convert:parallel   # With parallel processing

# Create a custom config for your project
cp config-url-sample.yml my-config.yml
# Edit my-config.yml with your settings
node svg2png.js --config my-config.yml --verbose
```

### Configuration Examples

#### Example 1: Custom Icon Collection from URLs

```yaml
# custom-icons.yml
icons:
  - home.svg
  - settings.svg
  - profile.svg

sources:
  - source: "https://example.com/icons/outline/"
    suffix: "_outline"
  - source: "https://example.com/icons/filled/"
    suffix: "_filled"

settings:
  size: 64
  color: "#333333"
  outputDirectory: "icons-output"
```

#### Example 2: Local Brand Assets

```yaml
# brand-assets.yml
icons:
  - logo.svg
  - icon.svg
  - symbol.svg

sources:
  - source: "./assets/brand/primary"
    suffix: "_primary"
  - source: "./assets/brand/secondary"
    suffix: "_secondary"

settings:
  size: 128
  color: "#FF6B35"
  outputDirectory: "brand-pngs"
```

### Output Structure

The converter creates these files in your specified output directory:

```
dist/
├── computer-desktop_outline.png (80x80px, outline style)
├── computer-desktop_solid.png (80x80px, solid style)
├── computer-desktop_outline_wide.png (320x180px with centered 160x160px icon, outline style)
├── computer-desktop_solid_wide.png (320x180px with centered 160x160px icon, solid style)
├── exclamation-circle_outline.png (80x80px, outline style)
├── exclamation-circle_solid.png (80x80px, solid style)
├── exclamation-circle_outline_wide.png (320x180px with centered 160x160px icon, outline style)
├── exclamation-circle_solid_wide.png (320x180px with centered 160x160px icon, solid style)
└── ... (and so on for all configured icons)
```

## Color Formats Supported

- Hex colors: `#ff0000`, `#f00`
- Named colors: `red`, `blue`, `green`
- RGB: `rgb(255, 0, 0)`
- RGBA: `rgba(255, 0, 0, 0.5)`

## Dependencies

- **sharp** - High-performance SVG to PNG conversion
- **jsdom** - SVG content manipulation and DOM parsing
- **js-yaml** - YAML configuration file parsing
- **Native fetch** - Built-in HTTP client (Node.js 18+)

## Version Requirements

- **Node.js 18+**: Required for native fetch API support
- **ES Modules**: Uses modern import/export syntax
- **NPM**: Package management and script execution

## Migration from Older Versions

If upgrading from a CommonJS version:

1. Ensure Node.js 18+ is installed
2. Configuration files remain compatible
3. All CLI options work the same way
4. New features: `--verbose` and `--parallel` options

## Files

- `svg2png.js` - Main converter script with modern architecture
- `config.yml` - Default YAML configuration file
- `config-url-sample.yml` - Sample configuration for URL-based sources
- `config-local-sample.yml` - Sample configuration for local directory sources
- `package.json` - Project configuration with ES modules support
- `dist/` - Default output directory for generated PNG files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Issues

If you encounter any issues or have feature requests, please [create an issue](https://github.com/sebastian2010/svg2png/issues) on GitHub.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

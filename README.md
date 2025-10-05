# Photo EXIF Manager

A powerful Obsidian plugin for reading and managing photo EXIF metadata, including capture time, camera model, aperture, shutter speed, and other photographic information.

[中文版本](docs/README.md)

## Features

- **EXIF Data Extraction**: Automatically read comprehensive EXIF metadata from photos
- **Metadata Display**: View detailed photo information including:
  - Capture date and time
  - Camera make and model
  - Aperture, shutter speed, and ISO settings
  - GPS coordinates (if available)
  - File size and dimensions
- **Seamless Integration**: Works directly within your Obsidian vault

## ⚠️ Important Notice

**This plugin is developed with AI assistance and may contain bugs or security vulnerabilities.** While we strive to provide a reliable tool, please:

- Use with caution and review the extracted data for accuracy
- Report any issues or unexpected behavior
- Consider the security implications before processing sensitive photos
- Keep regular backups of your vault

## Installation

### From BRAT Plugin (Recommended)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) in your Obsidian vault
2. Open the BRAT settings and add the following beta plugin:
   ```
   https://github.com/dangehub/obsidian-photo-exif-manager
   ```
3. Enable the plugin once it's installed

### Manual Installation (Alternative)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dangehub/obsidian-photo-exif-manager/releases)
2. Create a folder `obsidian-photo-exif-manager` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into this folder
4. Restart Obsidian and enable the plugin in **Settings → Community plugins**

## Usage

1. **Select Photos**: Choose photos in your vault that contain EXIF data
2. **Extract Metadata**: The plugin will automatically read and display EXIF information
3. **View Details**: Access comprehensive photo metadata through the plugin interface
4. **Export Options**: Export EXIF data in various formats as needed

## Requirements

- **Obsidian Version**: 0.15.0 or higher
- **Platform Support**: Desktop (Windows, macOS, Linux)
- **Mobile Support**: Not available (desktop-only features)

## Technical Details

- **Built with**: TypeScript and Obsidian Plugin API
- **EXIF Processing**: Uses the `exifr` library for reliable metadata extraction
- **Performance**: Optimized for handling multiple photos efficiently

## Development

### Prerequisites

- Node.js 16 or higher
- npm package manager

### Setup

```bash
# Install dependencies
npm install

# Start development mode (with hot reload)
npm run dev

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

This project is under active development with the following planned features:

- **EXIF to Properties**: Export EXIF data as Obsidian note properties for better integration
- **Batch Processing**: Support for processing multiple photos simultaneously
- **Bidirectional Sync**: Write metadata back to photo EXIF from Obsidian notes
- **Template Support**: Customizable export templates for different use cases

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/dangehub/obsidian-photo-exif-manager/issues) page
2. Create a new issue with detailed information about your problem
3. Provide sample files if relevant to help with debugging

## Changelog

### Version 0.0.1
- Initial release
- Basic EXIF data extraction and display
- Support for common photo formats (JPEG, PNG, TIFF) 
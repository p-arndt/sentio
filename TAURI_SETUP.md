# Tauri Setup Guide

Your SvelteKit application is now configured to work with Tauri for desktop builds.

## Prerequisites

1. **Rust**: Install Rust from [rustup.rs](https://rustup.rs/)
   ```bash
   # Verify installation
   rustc --version
   ```

2. **System Dependencies**:
   - **Windows**: Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
   - **Linux**: Install system dependencies (varies by distribution)

## Quick Start

### Development Mode

Run the app in development mode with hot-reload:

```bash
pnpm run tauri:dev
```

This will:
1. Start the SvelteKit dev server on `http://localhost:5173`
2. Launch the Tauri desktop window
3. Enable hot-reload for both frontend and backend changes

### Building for Production

Build the desktop application:

```bash
pnpm run tauri:build
```

The built application will be in `src-tauri/target/release/` (or `debug/` for debug builds).

## Configuration

### Icons

You need to add application icons to `src-tauri/icons/`. Required files:

- `32x32.png` - 32x32 pixel icon
- `128x128.png` - 128x128 pixel icon
- `128x128@2x.png` - 256x256 pixel icon (for Retina displays)
- `icon.icns` - macOS icon file
- `icon.ico` - Windows icon file

You can generate these from your logo using:
- [Tauri Icon Generator](https://github.com/tauri-apps/tauri-icon)
- Online tools like [CloudConvert](https://cloudconvert.com/)
- Image editing software

### App Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Window size and behavior
- App identifier
- Bundle settings
- Permissions

## Important Notes

### Backend/Server-Side Code

Since your app uses SvelteKit with server-side features (database, authentication, API routes), you have a few options:

1. **Run Backend Separately**: Keep your backend running as a separate service that the Tauri app connects to
2. **API Proxy**: Configure the Tauri app to proxy API calls to your backend server
3. **Tauri Backend**: Migrate server logic to Tauri's Rust backend (more complex)

For now, the Tauri build uses the static adapter (client-side only). Server-side routes won't work in the Tauri build unless you configure a backend connection.

### SSR Disabled

SSR is disabled for Tauri builds (see `src/routes/+layout.ts`). All rendering happens client-side.

### Environment Variables

The build process automatically detects Tauri builds using the `TAURI_PLATFORM` environment variable and switches to the static adapter.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Rust not found**: Make sure Rust is installed and in your PATH
2. **Missing dependencies**: Run `pnpm install` to ensure all dependencies are installed
3. **Icon errors**: Make sure all required icon files exist in `src-tauri/icons/`

### Development Issues

- If the dev server doesn't start, check that port 5173 is available
- Clear build cache: `rm -rf build/` and `rm -rf src-tauri/target/`
- Run `svelte-kit sync` to regenerate SvelteKit config

## Next Steps

1. Add your application icons to `src-tauri/icons/`
2. Customize `src-tauri/tauri.conf.json` for your app's needs
3. Test the development build: `pnpm run tauri:dev`
4. Build for production: `pnpm run tauri:build`

For more information, see the [Tauri Documentation](https://tauri.app/v1/guides/).


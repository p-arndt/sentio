# Tauri Configuration

This directory contains the Tauri backend configuration for the Sentio desktop application.

## Icons

You need to add application icons to the `icons/` directory. Tauri requires the following icon files:

- `32x32.png` - 32x32 pixel icon
- `128x128.png` - 128x128 pixel icon  
- `128x128@2x.png` - 256x256 pixel icon (for Retina displays)
- `icon.icns` - macOS icon file
- `icon.ico` - Windows icon file

You can generate these icons from your main logo/icon using tools like:
- [Tauri Icon Generator](https://github.com/tauri-apps/tauri-icon)
- Online icon converters
- Image editing software

## Building

To build the Tauri application:

```bash
pnpm run tauri:build
```

To run in development mode:

```bash
pnpm run tauri:dev
```

## Notes

- The frontend is built using SvelteKit with the static adapter for Tauri builds
- SSR is disabled for Tauri builds (see `src/routes/+layout.ts`)
- The build output goes to `build/client` which Tauri loads


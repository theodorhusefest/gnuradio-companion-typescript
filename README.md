# GNU Radio Companion - TypeScript Edition

A modern web-based companion application for GNU Radio built with React, TypeScript, and Vite.

## Features

- **528 GNU Radio Blocks Imported**: Automatically parses all GNU Radio block definitions from your local installation
- **Category Filtering**: Browse blocks by category (Analog, Digital, Filters, etc.)
- **Type-Safe**: Full TypeScript support with auto-generated types
- **Modern Stack**: Built with React 19, Vite, and Tailwind CSS
- **React Flow Ready**: Includes `@xyflow/react` for future drag-and-drop flowgraph editing

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- GNU Radio installed locally (tested with version 3.10.12.0)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

The app will automatically parse GNU Radio blocks on startup.

### Build

```bash
pnpm run build
```

### Electron standalone application
Electron is a way of running the javascript application without a browser. Electron is Chromium based and should work on any OS.
Electron requires the code to be compiled to ESmodule javascript before running.

Build with
```bash
pnpm run electron:build
```

Run with
```bash
pnpm run electron:dev
```

## How It Works

### Block Parsing

The project includes a custom block parser (`scripts/parse-blocks.ts`) that:

1. Scans GNU Radio block directories:
   - `/opt/homebrew/share/gnuradio/grc/blocks` (or your GNU Radio installation path)
   - `~/.local/state/gnuradio` (user blocks)

2. Parses all `.block.yml` files using `js-yaml`

3. Generates two files:
   - `src/blocks/blocks.json` - All block definitions (~4.1MB)
   - `src/blocks/types.ts` - TypeScript type definitions

### Block Data Structure

Each block includes:
- **id**: Unique block identifier (e.g., `analog_agc_xx`)
- **label**: Human-readable name
- **category**: Block category for organization
- **parameters**: Configurable parameters with types and defaults
- **inputs/outputs**: Port definitions with data types
- **templates**: Python/C++ code templates for execution

### Manual Block Refresh

If you update your GNU Radio installation or add custom blocks:

```bash
pnpm run parse-blocks
```

## Project Structure

```
├── scripts/
│   └── parse-blocks.ts      # GNU Radio block parser
├── src/
│   ├── blocks/              # Generated block definitions (gitignored)
│   │   ├── blocks.json
│   │   └── types.ts
│   ├── App.tsx              # Main application
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Future Roadmap

- [ ] Drag-and-drop block editor with React Flow
- [ ] Connection validation (type compatibility)
- [ ] Export to `.grc` format
- [ ] Parameter editing UI
- [ ] GNU Radio runtime integration
- [ ] Python script generation

## Technical Details

### Build-Time vs Runtime Loading

This project uses **build-time generation** (similar to GNU Radio Companion's caching approach):

- Blocks are parsed once during `pnpm run dev` or `pnpm run build`
- Generated files are cached and reused until GNU Radio is updated
- Fast startup and no runtime parsing overhead

### Why Build-Time Generation?

GNU Radio Companion itself uses dynamic loading with caching. We chose build-time generation because:

1. GNU Radio blocks rarely change (only on GNU Radio updates)
2. Better type safety with static JSON imports
3. No need for a backend server or Vite plugin
4. Easier to optimize bundle size in the future

## Contributing

This is an experimental project. Future contributions welcome for:

- React Flow canvas implementation
- GRC file format export
- Runtime execution integration

## License

[Your License Here]

## Acknowledgments

- Built on top of [GNU Radio](https://www.gnuradio.org/)
- Uses block definitions from GNU Radio Companion

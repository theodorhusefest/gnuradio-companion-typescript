# GNU Radio 4 GUI - TypeScript Edition

A modern web-based companion application for GNU Radio 4 built with React, TypeScript, and Vite.

## Features

- **Blocks imported from GR4**: Blocks are imported from GNU Radio 4 via HTTP or a WASM-compiled backend
- **Category Filtering**: Browse blocks by category
- **Type-Safe**: Full TypeScript support with auto-generated types
- **Modern Stack**: Built with React 19, Vite, and Tailwind CSS
- **React Flow Ready**: Includes `@xyflow/react` for drag-and-drop flowgraph editing

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- Optional: GNU Radio 4 installed locally (for the HTTP block loading)

### Installation

```bash
pnpm install
```

### Development

HTTP loading (default, requires running GR4 backend):
```bash
pnpm run dev
```


WASM loading:
```bash
VITE_BLOCK_SOURCE=wasm pnpm run dev
```

Git hooks are set up automatically via `pnpm install`. Pre-commit hooks run Prettier and ESLint on staged files.

Note: If you get the following error, chances are that some new dependencies have been added and you will have to re-run `pnpm install`.
```bash
5:47:47 PM [vite] Internal server error: Failed to resolve import (...) from "src/components/ui/(...).tsx". Does the file exist?
```

### Build

```bash
pnpm run build
```

### Electron standalone application
Electron is a way of running the JavaScript application without a browser. Electron is Chromium based and should work on any OS.
Electron requires the code to be compiled to ESmodule JavaScript before running.

Build with
```bash
pnpm run electron:build
```

Run with
```bash
pnpm run electron:dev
```

## Project Structure

```
├── src/
│   ├── components/          # Graphical components (canvas, blocks, ports, GUI widgets)
│   ├── stores/              # Zustand stores for flowgraph, clipboard, undo/redo and clipboard state
│   ├── services/            # Loading block definitions, import/export logic
│   ├── App.tsx              # Main application
│   └── main.tsx
├── electron/                # Electron desktop wrapper
├── test/                    # Vitest tests
├── e2e/                     # End-to-end tests
├── package.json
└── vite.config.ts
```

## License

[Your License Here]

## Acknowledgments

- Built on top of [GNU Radio 4](https://github.com/fair-acc/gnuradio4)

# GnuRadio Companion (TypeScript)

A companion application for the GnuRadio project built with React, TypeScript, and Vite.

## Prerequisites

- **Node.js** >= 20.19.0 or >= 22.12.0 (tested with v22.0.0)
- **pnpm** >= 10.0.0 (tested with v10.20.0)

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd gnuradio-companion-typescript
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

- `pnpm dev` - Start the development server with hot module replacement
- `pnpm build` - Build the application for production
- `pnpm lint` - Run ESLint to check for code issues
- `pnpm preview` - Preview the production build locally

## Development

### Styling with Tailwind CSS

This project uses Tailwind CSS 4 for styling. All styles are applied using utility classes directly in your components:

```tsx
<div className="flex items-center justify-center h-screen">
  <h1 className="text-3xl font-bold">Hello World</h1>
</div>
```

### Type Checking

TypeScript is configured for strict type checking. Run the type checker:

```bash
pnpm build
```

This will run `tsc -b` to check types before building.

### Code Quality

Run ESLint to check for code issues:

```bash
pnpm lint
```

## Building for Production

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory.

To preview the production build:

```bash
pnpm preview
```

## License

[Add your license here]

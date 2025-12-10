/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOCK_SOURCE?: "local" | "http";
  readonly VITE_BLOCKS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

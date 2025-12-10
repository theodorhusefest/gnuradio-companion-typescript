/**
 * Blocks Configuration
 *
 * Configuration for block data sources.
 * Set VITE_BLOCK_SOURCE to "http" to fetch from API, or "local" (default) for blocks.json
 */

export type BlockSource = "local" | "http";

export const BLOCK_SOURCE: BlockSource =
  (import.meta.env.VITE_BLOCK_SOURCE as BlockSource) || "local";

export const BLOCKS_API_URL: string =
  import.meta.env.VITE_BLOCKS_API_URL || "http://localhost:8080/blocks";

export const isHttpSource = (): boolean => BLOCK_SOURCE === "http";
export const isLocalSource = (): boolean => BLOCK_SOURCE === "local";

/**
 * Blocks Service
 *
 * Service for fetching GNU Radio blocks from various sources
 */

import type { BlocksData } from "@/types/blocks";
import { BLOCK_SOURCE, BLOCKS_API_URL, isHttpSource } from "@/config/blocks";

export type FetchBlocksResult =
  | { success: true; data: BlocksData }
  | { success: false; error: string };

/**
 * Fetch blocks from the local JSON file (dynamic import)
 */
async function fetchLocalBlocks(): Promise<FetchBlocksResult> {
  try {
    const blocksModule = await import("@/blocks/blocks.json");
    const data = blocksModule.default as BlocksData;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to load local blocks: ${message}`,
    };
  }
}

/**
 * Fetch blocks from HTTP API endpoint
 */
async function fetchHttpBlocks(): Promise<FetchBlocksResult> {
  console.log(BLOCKS_API_URL);
  try {
    const response = await fetch(BLOCKS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`,
      };
    }

    const data: BlocksData = await response.json();

    // Validate required fields
    if (!data.blocks || !data.blocksByCategory) {
      return {
        success: false,
        error: "Invalid response format: missing required fields",
      };
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to fetch blocks from API: ${message}`,
    };
  }
}

/**
 * Fetch blocks based on configured source
 */
export async function fetchBlocks(): Promise<FetchBlocksResult> {
  console.log(`[BlocksService] Fetching blocks from source: ${BLOCK_SOURCE}`);

  if (isHttpSource()) {
    console.log(`[BlocksService] Using HTTP endpoint: ${BLOCKS_API_URL}`);
    return fetchHttpBlocks();
  }

  return fetchLocalBlocks();
}

/**
 * Get the current block source configuration
 */
export function getBlockSourceInfo(): { source: string; url?: string } {
  return {
    source: BLOCK_SOURCE,
    url: isHttpSource() ? BLOCKS_API_URL : undefined,
  };
}

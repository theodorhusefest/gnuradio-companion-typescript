/**
 * Blocks Store
 *
 * Zustand store for managing GNU Radio blocks state.
 * Supports both local (blocks.json) and HTTP-based block sources.
 */

import { create } from "zustand";
import type {
  BlocksData,
  GnuRadioBlock,
  BlocksByCategory,
} from "@/types/blocks";
import { fetchBlocks, getBlockSourceInfo } from "@/services/blocksService";

export type BlocksStatus = "idle" | "loading" | "success" | "error";

type BlocksState = {
  // Data
  blocks: GnuRadioBlock[];
  blocksByCategory: BlocksByCategory;
  categories: string[];
  totalBlocks: number;
  generatedAt: string | null;

  // Status
  status: BlocksStatus;
  error: string | null;

  // Source info
  source: string;
  sourceUrl?: string;

  // Actions
  loadBlocks: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  blocks: [],
  blocksByCategory: {},
  categories: [],
  totalBlocks: 0,
  generatedAt: null,
  status: "idle" as BlocksStatus,
  error: null,
  ...getBlockSourceInfo(),
};

export const useBlocksStore = create<BlocksState>((set, get) => ({
  ...initialState,

  loadBlocks: async () => {
    const currentStatus = get().status;

    // Don't refetch if already loading
    if (currentStatus === "loading") {
      console.log("[BlocksStore] Already loading, skipping...");
      return;
    }

    // Allow refetch on error, but not on success
    if (currentStatus === "success" && get().blocks.length > 0) {
      console.log("[BlocksStore] Blocks already loaded, skipping...");
      return;
    }

    set({ status: "loading", error: null });

    const result = await fetchBlocks();

    if (result.success) {
      const data: BlocksData = result.data;
      set({
        blocks: data.blocks,
        blocksByCategory: data.blocksByCategory,
        categories: data.categories,
        totalBlocks: data.total_blocks,
        generatedAt: data.generated_at,
        status: "success",
        error: null,
      });
      console.log(`[BlocksStore] Loaded ${data.total_blocks} blocks`);
    } else {
      set({
        status: "error",
        error: result.error,
        blocks: [],
        blocksByCategory: {},
        categories: [],
        totalBlocks: 0,
      });
      console.error(`[BlocksStore] Failed to load blocks: ${result.error}`);
    }
  },

  reset: () => {
    set(initialState);
  },
}));

/**
 * Hook to get blocks loading status and trigger load
 */
export const useBlocksStatus = () => {
  const status = useBlocksStore((state) => state.status);
  const error = useBlocksStore((state) => state.error);
  const loadBlocks = useBlocksStore((state) => state.loadBlocks);

  return { status, error, loadBlocks };
};

/**
 * Hook to get blocks data (assumes already loaded)
 */
export const useBlocks = () => {
  const blocks = useBlocksStore((state) => state.blocks);
  const blocksByCategory = useBlocksStore((state) => state.blocksByCategory);
  const categories = useBlocksStore((state) => state.categories);
  const totalBlocks = useBlocksStore((state) => state.totalBlocks);

  return { blocks, blocksByCategory, categories, totalBlocks };
};

/**
 * Lookup a block by ID
 */
export const useBlockById = (blockId: string): GnuRadioBlock | undefined => {
  return useBlocksStore((state) =>
    state.blocks.find((block) => block.id === blockId)
  );
};

/**
 * Clipboard Store
 *
 * Zustand store for managing clipboard state (copied/cut nodes and edges)
 */

import { create } from "zustand";
import type { GraphEdge, GraphNode } from "../types/graph";

export type ClipboardData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
} | null;

interface ClipboardState {
  clipboard: ClipboardData;
  setClipboard: (data: ClipboardData) => void;
  clearClipboard: () => void;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  clipboard: null,

  setClipboard: (data: ClipboardData) => {
    set({ clipboard: data });
  },

  clearClipboard: () => {
    set({ clipboard: null });
  },
}));

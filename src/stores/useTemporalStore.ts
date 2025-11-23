/**
 * Temporal Store
 *
 * Provides undo/redo functionality for the graph store
 * Uses manual snapshots before each operation
 */

import { create } from "zustand";
import { useGraphStore } from "./graphStore";
import type { GraphNode, GraphEdge } from "../types/graph";

/**
 * Snapshot of graph state for history
 */
type GraphSnapshot = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type TemporalState = {
  past: GraphSnapshot[];
  future: GraphSnapshot[];

  // Actions
  undo: () => void;
  redo: () => void;
  clear: () => void;
  takeSnapshot: () => void;
};

const HISTORY_LIMIT = 50;

/**
 * Create a snapshot of the current graph state
 */
const createSnapshot = (): GraphSnapshot => {
  const state = useGraphStore.getState();
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
  };
};

/**
 * Restore a snapshot to the graph store
 */
const restoreSnapshot = (snapshot: GraphSnapshot) => {
  useGraphStore.setState({
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
    edges: JSON.parse(JSON.stringify(snapshot.edges)),
  });
};

/**
 * Temporal store for undo/redo
 */
export const useTemporalStore = create<TemporalState>((set, get) => ({
  past: [],
  future: [],

  takeSnapshot: () => {
    const snapshot = createSnapshot();
    set((state) => ({
      past: [...state.past, snapshot].slice(-HISTORY_LIMIT),
      future: [], // Clear future when new action is taken
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const currentSnapshot = createSnapshot();
    const previousSnapshot = past[past.length - 1];

    restoreSnapshot(previousSnapshot);

    set({
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future].slice(0, HISTORY_LIMIT),
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const currentSnapshot = createSnapshot();
    const nextSnapshot = future[0];

    restoreSnapshot(nextSnapshot);

    set({
      past: [...past, currentSnapshot].slice(-HISTORY_LIMIT),
      future: future.slice(1),
    });
  },

  clear: () => {
    set({ past: [], future: [] });
  },
}));

/**
 * Hook to access temporal actions
 */
export const useTemporalActions = () => {
  const undo = useTemporalStore((state) => state.undo);
  const redo = useTemporalStore((state) => state.redo);
  const clear = useTemporalStore((state) => state.clear);
  const takeSnapshot = useTemporalStore((state) => state.takeSnapshot);

  return { undo, redo, clear, takeSnapshot };
};

/**
 * Hook to check if undo/redo are available
 */
export const useCanUndoRedo = () => {
  const past = useTemporalStore((state) => state.past);
  const future = useTemporalStore((state) => state.future);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};

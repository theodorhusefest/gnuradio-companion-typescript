/**
 * useAutoLayout Hook
 *
 * Provides auto-layout functionality for arranging nodes hierarchically
 * Uses dagre for layout calculation
 */

import { calculateLayout } from "@/lib/layoutUtils";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import { useCallback } from "react";

/**
 * Hook for auto-layout functionality
 * Repositions nodes without changing the viewport zoom
 */
export function useAutoLayout() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const { takeSnapshot } = useTemporalActions();

  /**
   * Apply auto-layout to arrange all nodes in a hierarchical layout (top to bottom)
   */
  const autoLayout = useCallback(() => {
    // Need at least 2 nodes for layout to be meaningful
    if (nodes.length < 2) return;

    // Take snapshot before layout for undo support
    takeSnapshot();

    // Calculate new positions using dagre
    const layoutedNodes = calculateLayout(nodes, edges, {
      direction: "LR", // Left to right (horizontal)
    });

    // Update nodes with new positions
    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes, takeSnapshot]);

  /**
   * Check if auto-layout can be applied (need at least 2 nodes)
   */
  const canLayout = nodes.length >= 2;

  return {
    autoLayout,
    canLayout,
  };
}

/**
 * Hook for auto-layout that works outside ReactFlowProvider
 * Use this in toolbar components that are not wrapped in ReactFlowProvider
 */
export function useAutoLayoutStore() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const { takeSnapshot } = useTemporalActions();

  /**
   * Apply auto-layout to arrange all nodes in a hierarchical layout (top to bottom)
   */
  const autoLayout = useCallback(() => {
    // Need at least 2 nodes for layout to be meaningful
    if (nodes.length < 2) return;

    // Take snapshot before layout for undo support
    takeSnapshot();

    // Calculate new positions using dagre
    const layoutedNodes = calculateLayout(nodes, edges, {
      direction: "LR", // Left to right (horizontal)
    });

    // Update nodes with new positions
    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes, takeSnapshot]);

  /**
   * Check if auto-layout can be applied (need at least 2 nodes)
   */
  const canLayout = nodes.length >= 2;

  return {
    autoLayout,
    canLayout,
  };
}

/**
 * useClipboard Hook
 *
 * Provides clipboard operations for copy, cut, paste, and delete
 * Works with React Flow's selection state and the graph store
 */

import { duplicateNodes } from "@/lib/duplicateNodes";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { GraphEdge, GraphNode } from "@/types/graph";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export function useClipboard() {
  const { getNodes, getEdges } = useReactFlow();
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const { clipboard, setClipboard } = useClipboardStore();
  const { takeSnapshot } = useTemporalActions();

  /**
   * Copy selected nodes and their internal edges to clipboard
   */
  const copy = useCallback(() => {
    const nodes = getNodes() as GraphNode[];
    const edges = getEdges() as GraphEdge[];

    // Get all selected nodes
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;

    // Get IDs of selected nodes
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));

    // Get edges where both source AND target are in selected nodes (internal edges only)
    const selectedEdges = edges.filter(
      (edge) =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
    );

    // Store in clipboard (deep copy to prevent mutation issues)
    setClipboard({
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    });
  }, [getNodes, getEdges, setClipboard]);

  /**
   * Paste clipboard contents with new IDs and offset positions
   */
  const paste = useCallback(() => {
    if (!clipboard) return;

    // Take snapshot before paste for undo
    takeSnapshot();

    const nodes = getNodes() as GraphNode[];
    const edges = getEdges() as GraphEdge[];

    const { clonedNodes, clonedEdges } = duplicateNodes(
      clipboard.nodes,
      clipboard.edges,
      { positionOffset: { x: 20, y: 20 }, selected: true },
    );

    // Deselect all existing nodes and edges, then add clones
    setNodes([
      ...nodes.map((n) => ({ ...n, selected: false })),
      ...clonedNodes,
    ]);
    setEdges([
      ...edges.map((e) => ({ ...e, selected: false })),
      ...clonedEdges,
    ]);
  }, [clipboard, getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

  /**
   * Delete selected nodes and their connected edges
   */
  const deleteSelected = useCallback(() => {
    const nodes = getNodes() as GraphNode[];
    const edges = getEdges() as GraphEdge[];

    // Get selected node IDs
    const selectedNodeIds = new Set(
      nodes.filter((node) => node.selected).map((node) => node.id),
    );

    // Get selected edge IDs
    const selectedEdgeIds = new Set(
      edges.filter((edge) => edge.selected).map((edge) => edge.id),
    );

    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

    // Take snapshot before delete for undo
    takeSnapshot();

    // Remove selected nodes
    const remainingNodes = nodes.filter(
      (node) => !selectedNodeIds.has(node.id),
    );

    // Remove selected edges AND edges connected to deleted nodes
    const remainingEdges = edges.filter(
      (edge) =>
        !selectedEdgeIds.has(edge.id) &&
        !selectedNodeIds.has(edge.source) &&
        !selectedNodeIds.has(edge.target),
    );

    setNodes(remainingNodes);
    setEdges(remainingEdges);
  }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

  /**
   * Check if there are selected nodes/edges
   */
  const hasSelection = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    return (
      nodes.some((node) => node.selected) || edges.some((edge) => edge.selected)
    );
  }, [getNodes, getEdges]);

  /**
   * Check if clipboard has content
   */
  const hasClipboard = useCallback(() => {
    return clipboard !== null && clipboard.nodes.length > 0;
  }, [clipboard]);

  /**
   * Cut selected nodes (copy + delete)
   */
  const cut = useCallback(() => {
    // Get selected nodes before any modifications
    const nodes = getNodes() as GraphNode[];
    const edges = getEdges() as GraphEdge[];

    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
    const selectedEdges = edges.filter(
      (edge) =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
    );

    // Copy to clipboard
    setClipboard({
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    });

    // Take snapshot and delete
    takeSnapshot();

    // Get selected edge IDs too
    const selectedEdgeIds = new Set(
      edges.filter((edge) => edge.selected).map((edge) => edge.id),
    );

    const remainingNodes = nodes.filter(
      (node) => !selectedNodeIds.has(node.id),
    );
    const remainingEdges = edges.filter(
      (edge) =>
        !selectedEdgeIds.has(edge.id) &&
        !selectedNodeIds.has(edge.source) &&
        !selectedNodeIds.has(edge.target),
    );

    setNodes(remainingNodes);
    setEdges(remainingEdges);
  }, [getNodes, getEdges, setClipboard, setNodes, setEdges, takeSnapshot]);

  return {
    copy,
    cut,
    paste,
    deleteSelected,
    hasSelection,
    hasClipboard,
  };
}

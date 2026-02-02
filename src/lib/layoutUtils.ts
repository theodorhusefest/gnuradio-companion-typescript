/**
 * Layout Utilities
 *
 * Pure layout calculation functions using dagre for hierarchical graph layout
 */

import type { GraphEdge, GraphNode } from "@/types/graph";
import dagre from "dagre";

// Default node dimensions for layout calculation
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

export type LayoutDirection = "TB" | "LR" | "BT" | "RL";

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number; // Separation between ranks (vertical spacing for TB)
  nodeSep?: number; // Separation between nodes in the same rank
}

/**
 * Calculate new node positions using dagre hierarchical layout
 *
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param options - Layout options
 * @returns Array of nodes with recalculated positions
 */
export function calculateLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions = {},
): GraphNode[] {
  const {
    direction = "TB",
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeHeight = DEFAULT_NODE_HEIGHT,
    rankSep = DEFAULT_NODE_WIDTH + 150,
    nodeSep = DEFAULT_NODE_HEIGHT + 200,
  } = options;

  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set graph options
  g.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  });

  // Default to assigning a new object as a label for each new edge
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph with their dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(g);

  // Return nodes with updated positions
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);

    // dagre positions nodes from their center, so we need to adjust
    // to get the top-left corner position that React Flow expects
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
}

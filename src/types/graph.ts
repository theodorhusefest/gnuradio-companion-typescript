/**
 * Graph State Types
 *
 * Type definitions for the graph editor state management
 * Extends XyFlow types with GNU Radio block data
 */

import type { Node, Edge } from "@xyflow/react";
import type { GnuRadioBlock } from "./blocks";
import type { GRCOptions, GRCMetadata } from "../services/grcConverter";

/**
 * Block instance data stored in each node
 */
export type BlockInstanceData = {
  // Reference to the block definition
  blockDefinition: GnuRadioBlock;

  // Instance-specific parameter values
  // Maps parameter ID to its current value
  parameters: Record<string, string | number | boolean>;

  // Instance name (unique identifier within the flowgraph)
  instanceName: string;

  // Whether the block is enabled/disabled
  enabled: boolean;

  // Optional custom properties
  comment?: string;
  affinity?: string;
  alias?: string;

  bus_sink?: boolean;
  bus_source?: boolean;
  bus_structure?: string | null;
  rotation?: number;
};

/**
 * Graph node that combines XyFlow Node with block data
 */
export type GraphNode = Node<BlockInstanceData, "block">;

/**
 * Graph edge that combines XyFlow Edge with connection data
 * XyFlow already handles selection via edge.selected property
 */
export type GraphEdge = Edge<{
  sourcePort: string;
  targetPort: string;
  color?: string;
}>;

/**
 * Graph state type
 */
export type GraphState = {
  // Graph data
  nodes: GraphNode[];
  edges: GraphEdge[];

  // GRC file metadata (preserved from loaded files)
  grcOptions?: GRCOptions;
  grcMetadata?: GRCMetadata;

  // Node operations
  addNode: (node: GraphNode) => void;
  updateNode: (id: string, data: Partial<BlockInstanceData>) => void;
  removeNode: (id: string) => void;
  setNodes: (nodes: GraphNode[]) => void;

  // Edge operations
  addEdge: (edge: GraphEdge) => void;
  removeEdge: (id: string) => void;
  setEdges: (edges: GraphEdge[]) => void;

  // GRC metadata operations
  setGrcOptions: (options: GRCOptions | undefined) => void;
  setGrcMetadata: (metadata: GRCMetadata | undefined) => void;

  // Batch operations
  deleteNodeAndEdges: (nodeId: string) => void;
  importGraph: (nodes: GraphNode[], edges: GraphEdge[], grcOptions?: GRCOptions, grcMetadata?: GRCMetadata) => void;
  clearGraph: () => void;
};

/**
 * Temporal store state for undo/redo
 */
export type TemporalState = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  pastStates: GraphState[];
  futureStates: GraphState[];
};

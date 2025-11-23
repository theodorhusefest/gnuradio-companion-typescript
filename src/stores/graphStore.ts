/**
 * Graph Store
 *
 * Zustand store for managing the flowgraph state (nodes and edges)
 * This is the source of truth for the graph editor
 */

import { create } from 'zustand';
import type { GraphState, GraphNode, GraphEdge } from '../types/graph';

export const useGraphStore = create<GraphState>((set) => ({
  // Initial state
  nodes: [],
  edges: [],

  // Node operations
  addNode: (node: GraphNode) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  updateNode: (id: string, data: Partial<GraphNode['data']>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }));
  },

  removeNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
    }));
  },

  setNodes: (nodes: GraphNode[]) => {
    set({ nodes });
  },

  // Edge operations
  addEdge: (edge: GraphEdge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },

  removeEdge: (id: string) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    }));
  },

  setEdges: (edges: GraphEdge[]) => {
    set({ edges });
  },

  // Batch operations
  deleteNodeAndEdges: (nodeId: string) => {
    set((state) => {
      // Find all edges connected to this node
      const connectedEdgeIds = state.edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .map((edge) => edge.id);

      return {
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
          (edge) => !connectedEdgeIds.includes(edge.id)
        ),
      };
    });
  },

  importGraph: (nodes: GraphNode[], edges: GraphEdge[]) => {
    set({
      nodes,
      edges,
    });
  },

  clearGraph: () => {
    set({
      nodes: [],
      edges: [],
    });
  },
}));

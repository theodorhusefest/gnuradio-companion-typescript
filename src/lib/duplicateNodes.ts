import type { GraphEdge, GraphNode } from "@/types/graph";

let cloneIdCounter = 0;
const generateCloneId = () => `clone_${Date.now()}_${cloneIdCounter++}`;

/**
 * Duplicate a set of nodes and their internal edges (where both source and target are in the set).
 * Returns cloned nodes/edges with new IDs. Original nodes are not mutated.
 */
export function duplicateNodes(
  selectedNodes: GraphNode[],
  allEdges: GraphEdge[],
  options?: { positionOffset?: { x: number; y: number }; selected?: boolean },
): { clonedNodes: GraphNode[]; clonedEdges: GraphEdge[] } {
  const offset = options?.positionOffset ?? { x: 0, y: 0 };
  const selected = options?.selected ?? false;

  // Build old ID -> new ID mapping
  const idMap = new Map<string, string>();
  for (const node of selectedNodes) {
    idMap.set(node.id, generateCloneId());
  }

  const selectedIds = new Set(selectedNodes.map((n) => n.id));

  // Clone nodes
  const clonedNodes: GraphNode[] = selectedNodes.map((node) => ({
    ...node,
    id: idMap.get(node.id)!,
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
    selected,
    data: {
      ...node.data,
      instanceName: idMap.get(node.id)!,
    },
  }));

  // Clone internal edges (both endpoints in the selected set)
  const clonedEdges: GraphEdge[] = allEdges
    .filter(
      (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
    )
    .map((edge) => ({
      ...edge,
      id: generateCloneId(),
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
      selected,
    }));

  return { clonedNodes, clonedEdges };
}

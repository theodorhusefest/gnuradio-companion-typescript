import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { useClipboard } from "../../src/hooks/useClipboard";
import { useGraphStore } from "../../src/stores/graphStore";
import { useClipboardStore } from "../../src/stores/clipboardStore";
import type { GraphNode, GraphEdge } from "../../src/types/graph";

vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    useReactFlow: () => ({
      getNodes: () => useGraphStore.getState().nodes,
      getEdges: () => useGraphStore.getState().edges,
    }),
  };
});

const createMockNode = (id: string, selected = false): GraphNode => ({
  id,
  type: "block",
  position: { x: 100, y: 100 },
  selected,
  data: {
    blockDefinition: { id: "test_block", label: "Test Block" },
    parameters: {},
    instanceName: id,
    enabled: true,
    rotation: 0,
  },
});

const createMockEdge = (id: string, source: string, target: string): GraphEdge => ({
  id,
  source,
  target,
  data: { sourcePort: "0", targetPort: "0" },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("useClipboard", () => {
  beforeEach(() => {
    useGraphStore.setState({ nodes: [], edges: [] });
    useClipboardStore.setState({ clipboard: null });
  });

  it("should copy selected nodes and internal edges to clipboard", () => {
    const node1 = createMockNode("node1", true);
    const node2 = createMockNode("node2", true);
    const node3 = createMockNode("node3", false);
    const edge1 = createMockEdge("edge1", "node1", "node2"); // internal - should copy
    const edge2 = createMockEdge("edge2", "node1", "node3"); // external - should not copy
    useGraphStore.setState({ nodes: [node1, node2, node3], edges: [edge1, edge2] });

    const { result } = renderHook(() => useClipboard(), { wrapper });
    act(() => result.current.copy());

    const { clipboard } = useClipboardStore.getState();
    expect(clipboard?.nodes).toHaveLength(2);
    expect(clipboard?.edges).toHaveLength(1);
    expect(clipboard?.edges[0].id).toBe("edge1");
  });

  it("should paste nodes with new IDs and remap edges", () => {
    const node1 = createMockNode("node1", true);
    const node2 = createMockNode("node2", true);
    const edge = createMockEdge("edge1", "node1", "node2");
    useClipboardStore.setState({ clipboard: { nodes: [node1, node2], edges: [edge] } });

    const { result } = renderHook(() => useClipboard(), { wrapper });
    act(() => result.current.paste());

    const { nodes, edges } = useGraphStore.getState();
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).not.toBe("node1"); // new ID
    expect(nodes[1].id).not.toBe("node2"); // new ID
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe(nodes[0].id); // remapped
    expect(edges[0].target).toBe(nodes[1].id); // remapped
  });

  it("should cut (copy and delete) selected nodes", () => {
    const node1 = createMockNode("node1", true);
    const node2 = createMockNode("node2", false);
    useGraphStore.setState({ nodes: [node1, node2], edges: [] });

    const { result } = renderHook(() => useClipboard(), { wrapper });
    act(() => result.current.cut());

    const { clipboard } = useClipboardStore.getState();
    expect(clipboard?.nodes).toHaveLength(1);

    const { nodes } = useGraphStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("node2");
  });

  it("should delete selected nodes and connected edges", () => {
    const node1 = createMockNode("node1", true);
    const node2 = createMockNode("node2", false);
    const edge = createMockEdge("edge1", "node1", "node2");
    useGraphStore.setState({ nodes: [node1, node2], edges: [edge] });

    const { result } = renderHook(() => useClipboard(), { wrapper });
    act(() => result.current.deleteSelected());

    const { nodes, edges } = useGraphStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("node2");
    expect(edges).toHaveLength(0); // edge was connected to deleted node
  });
});

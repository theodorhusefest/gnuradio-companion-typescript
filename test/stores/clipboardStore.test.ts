import { beforeEach, describe, expect, it } from "vitest";
import { useClipboardStore } from "../../src/stores/clipboardStore";
import type { GraphNode } from "../../src/types/graph";

const createMockNode = (id: string): GraphNode => ({
  id,
  type: "block",
  position: { x: 100, y: 100 },
  data: {
    blockDefinition: { id: "test_block", label: "Test Block" },
    parameters: {},
    instanceName: id,
    enabled: true,
    rotation: 0,
  },
});

describe("clipboardStore", () => {
  beforeEach(() => {
    useClipboardStore.setState({ clipboard: null });
  });

  it("should set and retrieve clipboard data", () => {
    const { setClipboard } = useClipboardStore.getState();

    setClipboard({
      nodes: [createMockNode("node1")],
      edges: [],
    });

    const { clipboard } = useClipboardStore.getState();
    expect(clipboard?.nodes).toHaveLength(1);
    expect(clipboard?.nodes[0].id).toBe("node1");
  });

  it("should clear clipboard", () => {
    const { setClipboard, clearClipboard } = useClipboardStore.getState();

    setClipboard({ nodes: [createMockNode("node1")], edges: [] });
    clearClipboard();

    const { clipboard } = useClipboardStore.getState();
    expect(clipboard).toBeNull();
  });
});

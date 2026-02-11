import type { GnuRadioBlock } from "@/blocks/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAutoLayout } from "@/hooks/useAutoLayout";
import { useClipboard } from "@/hooks/useClipboard";
import { duplicateNodes } from "@/lib/duplicateNodes";
import { getEdgeColorFromDTypes, getPortDTypeFromNode } from "@/lib/portUtils";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { BlockInstanceData, GraphEdge, GraphNode } from "@/types/graph";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  addEdge as xyflowAddEdge,
  type FitViewOptions,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import {
  AlignStartVertical,
  Clipboard,
  ClipboardCopy,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";
import BlockNode from "./ui/blocks/BlockNode";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

const nodeTypes = {
  block: BlockNode,
  gnuradioBlock: BlockNode, // Keep for backward compatibility
};

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--foreground)" },
  style: { strokeWidth: 3, stroke: "var(--foreground)" },
};

const connectionLineStyle = {
  strokeWidth: 3,
  stroke: "var(--foreground)",
};

// Detect if user is on Mac for keyboard shortcut display
const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function ReactFlowContent() {
  // Use Zustand stores instead of local state
  const { theme } = useTheme();

  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const addEdge = useGraphStore((state) => state.addEdge);
  const { takeSnapshot } = useTemporalActions();

  // Clipboard functionality
  const clipboard = useClipboardStore((state) => state.clipboard);
  const { copy, cut, paste, deleteSelected } = useClipboard();

  // Check if there's a selection
  const hasSelection = useMemo(() => {
    return (
      nodes.some((node) => node.selected) || edges.some((edge) => edge.selected)
    );
  }, [nodes, edges]);

  // Check if clipboard has content
  const hasClipboard = clipboard !== null && clipboard.nodes.length > 0;

  // Auto-layout functionality
  const { autoLayout, canLayout } = useAutoLayout();

  // Rotation functionality
  const updateNode = useGraphStore((state) => state.updateNode);

  const rotateSelected = useCallback(
    (angle: number) => {
      const selectedNodes = nodes.filter((node) => node.selected);
      if (selectedNodes.length === 0) return;

      takeSnapshot();
      selectedNodes.forEach((node) => {
        const currentRotation = node.data.rotation || 0;
        const newRotation = (currentRotation + angle + 360) % 360;
        updateNode(node.id, { rotation: newRotation });
      });
    },
    [nodes, updateNode, takeSnapshot],
  );

  // Keyboard shortcuts for clipboard operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isModifier = event.metaKey || event.ctrlKey;

      // Copy: Cmd/Ctrl + C
      if (isModifier && event.key === "c") {
        event.preventDefault();
        copy();
      }

      // Cut: Cmd/Ctrl + X
      if (isModifier && event.key === "x") {
        event.preventDefault();
        cut();
      }

      // Paste: Cmd/Ctrl + V
      if (isModifier && event.key === "v") {
        event.preventDefault();
        paste();
      }

      // Delete: Delete or Backspace (without modifier)
      if (
        !isModifier &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        // Only handle if not typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          deleteSelected();
        }
      }

      // Rotate: R (clockwise) or Shift+R (counterclockwise)
      if (!isModifier && (event.key === "r" || event.key === "R")) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          if (event.shiftKey) {
            rotateSelected(-90);
          } else {
            rotateSelected(90);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copy, cut, paste, deleteSelected, rotateSelected]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isDuplicateDragRef = useRef(false);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const hasSignificantChange = changes.some(
        (change) => change.type === "remove" || change.type === "add",
      );
      // Skip snapshot if this add was triggered by duplicate-drag (already snapshotted)
      if (hasSignificantChange && !isDuplicateDragRef.current) {
        takeSnapshot();
      }

      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes as GraphNode[]);
    },
    [nodes, setNodes, takeSnapshot],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      // Take snapshot before edge changes
      const hasSignificantChange = changes.some(
        (change) => change.type === "remove" || change.type === "add",
      );
      if (hasSignificantChange) {
        takeSnapshot();
      }

      // Apply XyFlow changes and sync to store
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges as GraphEdge[]);
    },
    [edges, setEdges, takeSnapshot],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Take snapshot before adding edge
      takeSnapshot();
      // Create edge with connection data
      const newEdge = xyflowAddEdge(connection, edges)[
        edges.length
      ] as GraphEdge;
      if (newEdge) {
        // Get source and target nodes
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);

        // Get dtypes for source and target ports
        const sourceDType = getPortDTypeFromNode(
          sourceNode,
          connection.sourceHandle || "0",
          "output",
        );
        const targetDType = getPortDTypeFromNode(
          targetNode,
          connection.targetHandle || "0",
          "input",
        );

        // Determine edge color based on dtype matching
        const edgeColor = getEdgeColorFromDTypes(sourceDType, targetDType);

        // Add connection metadata and styling
        newEdge.data = {
          sourcePort: connection.sourceHandle || "0",
          targetPort: connection.targetHandle || "0",
          color: edgeColor,
        };
        newEdge.style = {
          ...newEdge.style,
          stroke: edgeColor,
        };
        newEdge.markerEnd = {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        };
        addEdge(newEdge);
      }
    },
    [edges, nodes, addEdge, takeSnapshot],
  );

  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, _node: GraphNode, draggedNodes: GraphNode[]) => {
      // Take snapshot BEFORE dragging to capture old position
      // This ensures undo restores to the position before the drag started
      takeSnapshot();

      // Shift+Option (Alt): duplicate-on-drag — clone selected nodes in place
      if (event.shiftKey && event.altKey) {
        isDuplicateDragRef.current = true;

        const { clonedNodes, clonedEdges } = duplicateNodes(
          draggedNodes,
          edges,
          { selected: false },
        );

        // Build old→clone ID mapping for external edge remapping
        const draggedIds = new Set(draggedNodes.map((n) => n.id));
        const idMap = new Map<string, string>();
        for (let i = 0; i < draggedNodes.length; i++) {
          idMap.set(draggedNodes[i].id, clonedNodes[i].id);
        }

        // Remap external edges so clones keep the connections at the original position.
        // The dragged originals move away without external edges.
        const updatedEdges = edges.map((edge) => {
          const srcDragged = draggedIds.has(edge.source);
          const tgtDragged = draggedIds.has(edge.target);

          // Internal edge — stays with dragged originals, clone handled by clonedEdges
          if (srcDragged && tgtDragged) return edge;

          // External edge — reassign to clone so it stays at original position
          if (srcDragged) return { ...edge, source: idMap.get(edge.source)! };
          if (tgtDragged) return { ...edge, target: idMap.get(edge.target)! };

          return edge;
        });

        // Add clones at original positions; external edges now point to clones
        setNodes([...nodes, ...clonedNodes]);
        setEdges([...updatedEdges, ...clonedEdges]);

        // Reset flag after React Flow processes the state update
        requestAnimationFrame(() => {
          isDuplicateDragRef.current = false;
        });
      }
    },
    [takeSnapshot, nodes, edges, setNodes, setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Get the block data from the drag event
      const blockDataString = event.dataTransfer.getData(
        "application/gnuradio-block",
      );
      if (!blockDataString) return;

      const block: GnuRadioBlock = JSON.parse(blockDataString);

      // Calculate position on the canvas
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new node with proper GraphNode structure
      const nodeIdValue = getNodeId();

      // Initialize parameters with default values from block definition
      const initialParameters: Record<string, string | number | boolean> = {};
      block.parameters?.forEach((param) => {
        if (param.default !== undefined) {
          initialParameters[param.id] = param.default;
        }
      });

      const instanceData: BlockInstanceData = {
        blockDefinition: block,
        parameters: initialParameters,
        instanceName: nodeIdValue,
        enabled: true,
        bus_sink: false,
        bus_source: false,
        bus_structure: null,
        rotation: 0,
      };

      const newNode: GraphNode = {
        id: nodeIdValue,
        type: "block",
        position,
        data: instanceData,
      };

      // Take snapshot before adding node (captures state without this node)
      takeSnapshot();

      // Add to store
      setNodes([...nodes, newNode]);
    },
    [screenToFlowPosition, nodes, setNodes, takeSnapshot],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={reactFlowWrapper} className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={connectionLineStyle}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitViewOptions={fitViewOptions}
            colorMode={theme}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={cut} disabled={!hasSelection}>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>{isMac ? "⌘X" : "Ctrl+X"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={copy} disabled={!hasSelection}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>{isMac ? "⌘C" : "Ctrl+C"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={paste} disabled={!hasClipboard}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>{isMac ? "⌘V" : "Ctrl+V"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => rotateSelected(90)}
          disabled={!hasSelection}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Rotate Clockwise
          <ContextMenuShortcut>R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => rotateSelected(-90)}
          disabled={!hasSelection}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Rotate Counterclockwise
          <ContextMenuShortcut>⇧R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => autoLayout()} disabled={!canLayout}>
          <AlignStartVertical className="mr-2 h-4 w-4" />
          Auto Layout
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={deleteSelected}
          disabled={!hasSelection}
          variant="destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>{isMac ? "⌫" : "Del"}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ReactFlowWindow() {
  return (
    <ReactFlowProvider>
      <ReactFlowContent />
    </ReactFlowProvider>
  );
}

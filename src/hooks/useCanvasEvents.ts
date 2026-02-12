import type { GnuRadioBlock } from "@/blocks/types";
import { duplicateNodes } from "@/lib/duplicateNodes";
import { getEdgeColorFromDTypes, getPortDTypeFromNode } from "@/lib/portUtils";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { BlockInstanceData, GraphEdge, GraphNode } from "@/types/graph";
import {
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  useReactFlow,
  addEdge as xyflowAddEdge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, useRef, type DragEvent } from "react";

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export function useCanvasEvents() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const addEdge = useGraphStore((state) => state.addEdge);
  const { takeSnapshot } = useTemporalActions();

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

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    onDragOver,
    onDrop,
  };
}

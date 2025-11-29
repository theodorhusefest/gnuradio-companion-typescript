import type { GnuRadioBlock } from "@/blocks/types";
import {
  addEdge as xyflowAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type FitViewOptions,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, useRef, type DragEvent } from "react";
import BlockNode from "./ui/blocks/BlockNode";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { GraphNode, GraphEdge, BlockInstanceData } from "@/types/graph";

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
  markerEnd: { type: MarkerType.ArrowClosed, color: "#000" },
  style: { strokeWidth: 3, stroke: "#000" },
};

const connectionLineStyle = {
  strokeWidth: 3,
  stroke: "#000",
};

function ReactFlowContent() {
  // Use Zustand stores instead of local state
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const addEdge = useGraphStore((state) => state.addEdge);
  const { takeSnapshot } = useTemporalActions();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const hasSignificantChange = changes.some(
        (change) => change.type === "remove" || change.type === "add"
      );
      if (hasSignificantChange) {
        takeSnapshot();
      }

      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes as GraphNode[]);
    },
    [nodes, setNodes, takeSnapshot]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      // Take snapshot before edge changes
      const hasSignificantChange = changes.some(
        (change) => change.type === "remove" || change.type === "add"
      );
      if (hasSignificantChange) {
        takeSnapshot();
      }

      // Apply XyFlow changes and sync to store
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges as GraphEdge[]);
    },
    [edges, setEdges, takeSnapshot]
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
        // Add connection metadata
        newEdge.data = {
          sourcePort: connection.sourceHandle || "0",
          targetPort: connection.targetHandle || "0",
        };
        addEdge(newEdge);
      }
    },
    [edges, addEdge, takeSnapshot]
  );

  const onNodeDragStart = useCallback(() => {
    // Take snapshot BEFORE dragging to capture old position
    // This ensures undo restores to the position before the drag started
    takeSnapshot();
  }, [takeSnapshot]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Get the block data from the drag event
      const blockDataString = event.dataTransfer.getData(
        "application/gnuradio-block"
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
    [screenToFlowPosition, nodes, setNodes, takeSnapshot]
  );

  return (
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
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function ReactFlowWindow() {
  return (
    <ReactFlowProvider>
      <ReactFlowContent />
    </ReactFlowProvider>
  );
}

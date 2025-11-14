import type { GnuRadioBlock } from "@/blocks/types";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type FitViewOptions,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, useRef, useState, type DragEvent } from "react";
import BlockNode from "./ui/blocks/BlockNode";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

const nodeTypes = {
  gnuradioBlock: BlockNode,
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
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Get the block data from the drag event
      const blockData = event.dataTransfer.getData(
        "application/gnuradio-block"
      );
      if (!blockData) return;

      const block: GnuRadioBlock = JSON.parse(blockData);

      // Calculate position on the canvas
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new node
      const newNode: Node = {
        id: getNodeId(),
        type: "gnuradioBlock",
        position,
        data: {
          label: block.label,
          block: block,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
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

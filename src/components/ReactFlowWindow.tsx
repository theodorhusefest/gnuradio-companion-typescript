import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge,
  type FitViewOptions,
  type Node,
  type Edge,
} from "@xyflow/react";
import { useCallback, useState } from "react";

const initialNodes: Node[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    data: { label: "Node 1" },
    type: "input",
  },
  {
    id: "n2",
    position: { x: 100, y: 100 },
    data: { label: "Node 2" },
  },
];
const initialEdges: Edge[] = [
  {
    id: "n1-n2",
    source: "n1",
    target: "n2",
  },
];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

export function ReactFlowWindow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitViewOptions={fitViewOptions}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

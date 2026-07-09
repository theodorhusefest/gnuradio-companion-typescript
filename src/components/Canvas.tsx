import { CanvasContextMenu } from "@/components/CanvasContextMenu";
import { useTheme } from "@/hooks/use-theme";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useGraphStore } from "@/stores/graphStore";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type FitViewOptions,
} from "@xyflow/react";
import { useRef } from "react";
import BlockNode from "./ui/blocks/BlockNode";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

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

function CanvasContent() {
  const { theme } = useTheme();
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const { copy, cut, paste, deleteSelected } = useClipboard();
  const { rotateSelected } = useKeyboardShortcuts({
    copy,
    cut,
    paste,
    deleteSelected,
  });

  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    onDragOver,
    onDrop,
  } = useCanvasEvents();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  return (
    <CanvasContextMenu rotateSelected={rotateSelected}>
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
    </CanvasContextMenu>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}

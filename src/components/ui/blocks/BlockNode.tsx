import type { BlockParameter } from "@/blocks/types";
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { Separator } from "../separator";
import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import BlockDetailsDialog from "./BlockDetailsDialog";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { GraphNode } from "@/types/graph";

// Map rotation to handle positions
const getHandlePositions = (rotation: number): { input: Position; output: Position } => {
  switch (rotation) {
    case 90:
      return { input: Position.Top, output: Position.Bottom };
    case 180:
      return { input: Position.Right, output: Position.Left };
    case 270:
      return { input: Position.Bottom, output: Position.Top };
    default: // 0
      return { input: Position.Left, output: Position.Right };
  }
};

const BlockNode = ({ data, id }: NodeProps<GraphNode>) => {
  const blockDefinition = data.blockDefinition;
  const label = blockDefinition.label;
  const rotation = data.rotation || 0;

  // Get store actions
  const updateNode = useGraphStore((state) => state.updateNode);
  const { takeSnapshot } = useTemporalActions();
  const updateNodeInternals = useUpdateNodeInternals();

  // Update node internals when rotation changes (for handle positions)
  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, id, updateNodeInternals]);

  const { input: inputPosition, output: outputPosition } = getHandlePositions(rotation);

  const inputs = blockDefinition.inputs?.filter((input) => !input.optional);
  const outputs = blockDefinition.outputs?.filter((input) => !input.optional);

  const isDeprecated = blockDefinition.flags?.includes("deprecated");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get current parameter values from node data or use defaults
  const currentParameters = data.parameters || {};

  // Build parameter list with current values
  const allParameters: BlockParameter[] = blockDefinition.parameters
    ? blockDefinition.parameters.map((param) => ({
        ...param,
        default: currentParameters[param.id] ?? param.default,
      }))
    : [];

  const displayParameters = allParameters.filter((param) => !param.hide);

  // Handler to update parameters in the store
  const handleParametersUpdate = (
    updates: Record<string, string | number | boolean>
  ) => {
    // Take snapshot before updating parameters
    takeSnapshot();

    // Update the graph store with new parameter values
    updateNode(id, {
      parameters: {
        ...currentParameters,
        ...updates,
      },
    });
  };

  const handleStyle: CSSProperties = {
    width: "1em",
    height: "1em",
  };

  const handleDoubleClick = () => {
    if (allParameters && allParameters.length > 0) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <div
        className="px-4 py-2 rounded-lg border-2 min-w-[150px] shadow-sm bg-card shadow-foreground/10"
        style={{
          opacity: isDeprecated ? 0.6 : 1,
        }}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="font-bold text-xl">{label}</div>
        </div>

        {blockDefinition.category && (
          <div className="text mt-1 opacity-70">{blockDefinition.category}</div>
        )}

        <div className="space-y-2">
          {displayParameters?.map((param) => (
            <div key={param.id} className="space-y-2">
              <Separator />
              <div className="flex justify-between font-medium gap-3">
                <span className="block"> {param.label}</span>
                <span className="block">{param.default}</span>
              </div>
            </div>
          ))}
        </div>

        {inputs?.map((input) => (
          <Handle
            key={input.id}
            type="target"
            style={handleStyle}
            position={inputPosition}
            id={input.id}
          />
        ))}
        {outputs?.map((output) => (
          <Handle
            key={output.id}
            type="source"
            style={handleStyle}
            position={outputPosition}
            id={output.id}
          />
        ))}
      </div>

      {/* Dialog for editing parameters */}
      {allParameters && allParameters.length > 0 && (
        <BlockDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          parameters={allParameters}
          nodeId={id}
          onSave={handleParametersUpdate}
        />
      )}
    </>
  );
};

export default BlockNode;

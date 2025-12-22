import { Position, type NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import { useState, useEffect } from "react";
import BlockDetailsDialog from "./BlockDetailsDialog";
import ParametersDisplay from "./ParametersDisplay";
import PortsContainer from "./PortsContainer";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { GraphNode } from "@/types/graph";
import { getPorts } from "@/lib/portUtils";
import {
  buildParametersWithValues,
  getPortDType,
  getShouldShowPorts,
  calculateNodeHeight,
} from "@/lib/blockUtils";

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

  const updateNode = useGraphStore((state) => state.updateNode);
  const { takeSnapshot } = useTemporalActions();
  const updateNodeInternals = useUpdateNodeInternals();

  // Update node internals when rotation changes (for handle positions)
  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, id, updateNodeInternals]);

  const { input: inputPosition, output: outputPosition } = getHandlePositions(rotation);

  const isDeprecated = blockDefinition.flags?.includes("deprecated");
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentParameters = data.parameters || {};
  const allParameters = buildParametersWithValues(
    blockDefinition.parameters,
    currentParameters
  );

  const portDType = getPortDType(allParameters);
  const shouldShowPorts = getShouldShowPorts(allParameters);
  const inputs = getPorts(blockDefinition.inputs, shouldShowPorts);
  const outputs = getPorts(blockDefinition.outputs, shouldShowPorts);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputs.length, outputs.length, updateNodeInternals]);


  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputs.length, outputs.length, updateNodeInternals]);

  const displayParameters = allParameters.filter((param) => !param.hide);

  const handleParametersUpdate = (
    updates: Record<string, string | number | boolean>
  ) => {
    takeSnapshot();
    updateNode(id, {
      parameters: {
        ...currentParameters,
        ...updates,
      },
    });
  };

  const handleDoubleClick = () => {
    if (allParameters.length > 0) {
      setDialogOpen(true);
    }
  };

  const minimumNodeHeight = calculateNodeHeight(inputs.length, outputs.length);

  return (
    <>
      <div
        className="px-4 py-2 rounded-lg border-2 min-w-[150px] shadow-sm bg-card shadow-foreground/10"
        style={{
          opacity: isDeprecated ? 0.6 : 1,
          minHeight: minimumNodeHeight,
        }}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="font-bold text-xl">{label}</div>
        </div>

        {blockDefinition.category && (
          <div className="text mt-1 opacity-70">{blockDefinition.category}</div>
        )}

        <ParametersDisplay parameters={displayParameters} />

        <PortsContainer
          ports={inputs}
          type="input"
          blockDType={portDType}
          position={inputPosition}
        />
        <PortsContainer
          ports={outputs}
          type="output"
          blockDType={portDType}
          position={outputPosition}
        />
      </div >

      {
        allParameters.length > 0 && (
          <BlockDetailsDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            parameters={allParameters}
            nodeId={id}
            onSave={handleParametersUpdate}
          />
        )
      }
    </>
  );
};

export default BlockNode;

import type { BlockParameter } from "@/blocks/types";
import { type NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import { Separator } from "../separator";
import { useState, useEffect } from "react";
import BlockDetailsDialog from "./BlockDetailsDialog";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import type { GraphNode } from "@/types/graph";
import { getPortHandleId } from "@/lib/portUtils";
import Port from "./Port";

const BlockNode = ({ data, id }: NodeProps<GraphNode>) => {
  const blockDefinition = data.blockDefinition;
  const label = blockDefinition.label;
  const updateNodeInternals = useUpdateNodeInternals();

  // Get store actions
  const updateNode = useGraphStore((state) => state.updateNode);
  const { takeSnapshot } = useTemporalActions();

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

  const blockType = allParameters.find((param) => param.id === "type")?.default;

  const showMsgPortsParam = allParameters.find(
    (param) => param.id === "showports"
  );
  const shouldShowPorts = showMsgPortsParam?.default === "True";

  const inputs =
    blockDefinition.inputs?.filter(
      (input) => !input.optional || shouldShowPorts
    ) ?? [];
  const outputs =
    blockDefinition.outputs?.filter(
      (output) => !output.optional || shouldShowPorts
    ) ?? [];

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputs.length, outputs.length, updateNodeInternals]);

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

  const handleDoubleClick = () => {
    if (allParameters && allParameters.length > 0) {
      setDialogOpen(true);
    }
  };
  const minimumNodeHeight =
    100 +
    40 * (inputs.length > outputs.length ? inputs.length : outputs.length);
  return (
    <>
      <div
        className={
          "relative px-4 py-2 rounded-lg border-2 min-w-[150px] shadow-sm bg-white"
        }
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
        <div className="absolute -left-12 top-0 flex flex-col justify-around h-full">
          {inputs?.map((input, index) => {
            const handleId: string = getPortHandleId(input, index, "input");
            return (
              <Port
                key={handleId}
                portId={handleId}
                port={input}
                type="input"
                blockDType={blockType?.toString()}
              />
            );
          })}
        </div>
        <div className="absolute -right-12 top-0 flex flex-col justify-around h-full">
          {outputs?.map((output, index) => {
            const handleId = getPortHandleId(output, index, "output");
            return (
              <Port
                key={handleId}
                portId={handleId}
                port={output}
                type="output"
                blockDType={blockType?.toString()}
              />
            );
          })}
        </div>
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

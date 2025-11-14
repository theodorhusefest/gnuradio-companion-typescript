import type { GnuRadioBlock } from "@/blocks/types";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Separator } from "../separator";
import type { CSSProperties } from "react";

type BlockNode = Node<
  {
    label: string;
    block: GnuRadioBlock;
  },
  "gnuradioBlock"
>;

const BlockNode = ({ data }: NodeProps<BlockNode>) => {
  const { label, block, nodeId } = data;

  const inputs = block?.inputs?.filter((input) => !input.optional);
  const outputs = block?.outputs?.filter((input) => !input.optional);
  const displayParameters = block.parameters?.filter((param) => !param.hide);

  const isDeprecated = block.flags?.includes("deprecated");

  const handleStyle: CSSProperties = {
    width: "1em",
    height: "1em",
  };

  return (
    <div
      className="px-4 py-2 rounded-lg border-2 min-w-[150px] shadow-sm bg-white"
      style={{
        opacity: isDeprecated ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="font-bold text-xl">{label}</div>
      </div>

      {block.category && (
        <div className="text mt-1 opacity-70">{block.category}</div>
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
          position={Position.Left}
          id={input.id}
        />
      ))}
      {outputs?.map((output) => (
        <Handle
          key={output.id}
          type="source"
          style={handleStyle}
          position={Position.Right}
          id={output.id}
        />
      ))}
    </div>
  );
};

export default BlockNode;

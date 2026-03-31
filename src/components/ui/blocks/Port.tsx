import { getPortColor } from "@/lib/portUtils";
import { cn } from "@/lib/utils";
import type { BlockPort } from "@/types/blocks";
import { Handle, Position } from "@xyflow/react";

type Props = {
  port: BlockPort;
  portId: string;
  type: "input" | "output";
  blockDType: string | undefined;
  position: Position;
};

const Port = ({ port, portId, type, blockDType, position }: Props) => {
  const isInput = type === "input";

  const handleTransform = {
    [Position.Left]: "translate(0, -50%)",
    [Position.Right]: "translate(-100%, -50%)",
    [Position.Top]: "translate(-50%, 10%)",
    [Position.Bottom]: "translate(-50%, -100%)",
  }[position];

  return (
    <Handle
      type={isInput ? "target" : "source"}
      position={position}
      id={portId}
      style={{ position: "static", background: "transparent" }}
    >
      <div
        className={cn(
          getPortColor(port, blockDType),
          "w-12 flex items-center justify-center h-4 rounded text-xs text-black",
        )}
        style={{ transform: handleTransform }}
      >
        {portId}
      </div>
    </Handle>
  );
};

export default Port;

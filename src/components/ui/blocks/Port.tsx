import { getPortColor } from "@/lib/portUtils";
import { cn } from "@/lib/utils";
import type { BlockPort } from "@/types/blocks";
import { Handle, Position } from "@xyflow/react";

type Props = {
  port: BlockPort;
  portId: string;
  type: "input" | "output";
  blockDType: string | undefined;
};

const Port = ({ port, portId, type, blockDType }: Props) => {
  const isInput = type === "input";

  return (
    <Handle
      type={isInput ? "target" : "source"}
      position={isInput ? Position.Left : Position.Right}
      id={portId}
      style={{ position: "static", background: "transparent" }}
    >
      <div
        className={cn(
          getPortColor(port, blockDType),
          "absolute w-12 -translate-y-1/2 flex items-center justify-center rounded",
          !isInput && "-left-12"
        )}
      >
        {portId}
      </div>
    </Handle>
  );
};

export default Port;

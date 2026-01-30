import type { BlockPort } from "@/types/blocks";
import { getPortHandleId } from "@/lib/portUtils";
import Port from "./Port";
import { Position } from "@xyflow/react";

interface PortsContainerProps {
  ports: BlockPort[];
  type: "input" | "output";
  blockDType?: string;
  position: Position;
}

const PortsContainer = ({ ports, type, blockDType, position }: PortsContainerProps) => {
  // Position and layout based on handle position (adapts to rotation)
  const containerClass = {
    [Position.Left]: "absolute -left-12 top-0 flex flex-col justify-around h-full",
    [Position.Right]: "absolute -right-12 top-0 flex flex-col justify-around h-full",
    [Position.Top]: "absolute -top-4 left-0 flex flex-row justify-around w-full",
    [Position.Bottom]: "absolute -bottom-4 left-0 flex flex-row justify-around w-full",
  }[position];

  return (
    <div className={containerClass}>
      {ports.map((port, index) => {
        const handleId = getPortHandleId(port, index, type);
        return (
          <Port
            key={handleId}
            portId={handleId}
            port={port}
            type={type}
            blockDType={blockDType}
            position={position}
          />
        );
      })}
    </div>
  );
};

export default PortsContainer;

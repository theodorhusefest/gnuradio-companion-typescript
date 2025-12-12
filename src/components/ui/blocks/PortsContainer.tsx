import type { BlockPort } from "@/types/blocks";
import { getPortHandleId } from "@/lib/portUtils";
import Port from "./Port";

interface PortsContainerProps {
  ports: BlockPort[];
  type: "input" | "output";
  blockDType?: string;
}

const PortsContainer = ({ ports, type, blockDType }: PortsContainerProps) => {
  const positionClass = type === "input" ? "-left-12" : "-right-12";

  return (
    <div
      className={`absolute ${positionClass} top-0 flex flex-col justify-around h-full`}
    >
      {ports.map((port, index) => {
        const handleId = getPortHandleId(port, index, type);
        return (
          <Port
            key={handleId}
            portId={handleId}
            port={port}
            type={type}
            blockDType={blockDType}
          />
        );
      })}
    </div>
  );
};

export default PortsContainer;

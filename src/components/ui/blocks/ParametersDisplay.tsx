import type { BlockParameter } from "@/types/blocks";
import { Separator } from "../separator";

interface ParametersDisplayProps {
  parameters: BlockParameter[];
}

const ParametersDisplay = ({ parameters }: ParametersDisplayProps) => {
  if (parameters.length === 0) return null;

  return (
    <div className="space-y-2">
      {parameters.map((param) => (
        <div key={param.id} className="space-y-2">
          <Separator />
          <div className="flex justify-between font-medium gap-3">
            <span className="block">{param.label}</span>
            <span className="block">{param.default}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParametersDisplay;

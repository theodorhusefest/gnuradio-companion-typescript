import { ButtonGroup } from "@/components/ui/button-group";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import { RotateCcw, RotateCw } from "lucide-react";
import { Button } from "../ui/button";

const RotationButtons = () => {
  const nodes = useGraphStore((state) => state.nodes);
  const updateNode = useGraphStore((state) => state.updateNode);
  const { takeSnapshot } = useTemporalActions();

  const selectedNodes = nodes.filter((node) => node.selected);
  const canRotate = selectedNodes.length > 0;

  const handleRotate = (angle: number) => {
    if (!canRotate) return;
    takeSnapshot();
    selectedNodes.forEach((node) => {
      const currentRotation = node.data.rotation || 0;
      const newRotation = (currentRotation + angle + 360) % 360;
      updateNode(node.id, { rotation: newRotation });
    });
  };

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        onClick={() => handleRotate(-90)}
        disabled={!canRotate}
      >
        <RotateCcw size={24} />
      </Button>
      <Button
        variant="outline"
        onClick={() => handleRotate(90)}
        disabled={!canRotate}
      >
        <RotateCw size={24} />
      </Button>
    </ButtonGroup>
  );
};

export default RotationButtons;

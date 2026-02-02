import { ButtonGroup } from "@/components/ui/button-group";
import { useAutoLayoutStore } from "@/hooks/useAutoLayout";
import { AlignStartVertical } from "lucide-react";
import { Button } from "../ui/button";

const LayoutButtons = () => {
  const { autoLayout, canLayout } = useAutoLayoutStore();

  return (
    <ButtonGroup>
      <Button variant="outline" onClick={autoLayout} disabled={!canLayout}>
        <AlignStartVertical size={24} />
      </Button>
    </ButtonGroup>
  );
};

export default LayoutButtons;

import {
  useTemporalActions,
  useTemporalStore,
} from "@/stores/useTemporalStore";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "../ui/button";
import { Redo2, Trash, Undo2 } from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";

const UndoRedoButtons = () => {
  const { past, future } = useTemporalStore();
  const { undo, redo, clear } = useTemporalActions();
  const { clearGraph } = useGraphStore();

  const handleClearGraph = () => {
    clear();
    clearGraph();
  };

  const isUndoAvailable = past.length > 0;
  const isRedoAvailable = future.length > 0;

  return (
    <ButtonGroup>
      <Button variant="outline" onClick={undo} disabled={!isUndoAvailable}>
        <Undo2 size={24} />
      </Button>
      <Button variant="outline" onClick={redo} disabled={!isRedoAvailable}>
        <Redo2 size={24} />
      </Button>
      <Button
        variant="outline"
        onClick={handleClearGraph}
        disabled={!isUndoAvailable}
      >
        <Trash size={24} />
      </Button>
    </ButtonGroup>
  );
};

export default UndoRedoButtons;

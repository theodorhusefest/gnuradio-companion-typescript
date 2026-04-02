import { ButtonGroup } from "@/components/ui/button-group";
import { Play, Square } from "lucide-react";
import { Button } from "../ui/button";

const ExecutionButtons = () => {
  const runFlowgraph = () => {
    /*
    TODO:
    1. Create a YAML representation of the flowgraph.
    2. Send it to the backend for execution
    */
  };

  const stopFlowgraph = () => {
    // TODO: Ask the backend to halt the scheduler
  };

  return (
    <ButtonGroup>
      <Button variant="outline" onClick={runFlowgraph} disabled={false}>
        <Play size={24} />
      </Button>
      <Button variant="outline" onClick={stopFlowgraph} disabled={true}>
        <Square size={24} />
      </Button>
    </ButtonGroup>
  );
};

export default ExecutionButtons;

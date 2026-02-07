import { BlocksWindow } from "@/components/BlocksWindow";
import { DetailsWindow } from "@/components/DetailsWindow";
import { ReactFlowWindow } from "@/components/ReactFlowWindow";
import Toolbar from "@/components/Toolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTemporalActions } from "@/stores/useTemporalStore";
import { useEffect } from "react";

function App() {
  const { undo, redo } = useTemporalActions();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isModifier = event.metaKey || event.ctrlKey;

      if (!isModifier) return;

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        console.log("Undo triggered");
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if (event.key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        console.log("Redo triggered");
      }

      // Alternative Redo: Cmd/Ctrl + Y
      if (event.key === "y") {
        event.preventDefault();
        redo();
        console.log("Redo triggered (Ctrl+Y)");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);
  return (
    <div className="h-screen w-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={75} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <ReactFlowWindow />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <DetailsWindow />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <BlocksWindow />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;

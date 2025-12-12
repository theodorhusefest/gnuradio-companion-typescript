import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useGraphStore } from "@/stores/graphStore";
import {
  useTemporalActions,
  useTemporalStore,
} from "@/stores/useTemporalStore";
import { parseGRCToGraph, exportGraphToGRC } from "@/services/grcConverter";

const Menu = () => {
  const { past, future } = useTemporalStore();
  const { undo, redo, clear } = useTemporalActions();
  const { nodes, edges, grcOptions, grcMetadata, importGraph, clearGraph } =
    useGraphStore();

  const handleNew = () => {
    if (nodes.length > 0 || edges.length > 0) {
      const confirmed = confirm(
        "Are you sure you want to create a new flowgraph? Unsaved changes will be lost."
      );
      if (!confirmed) return;
    }
    clear();
    clearGraph();
  };

  const handleOpen = () => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".grc";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const result = parseGRCToGraph(content);

        // Clear undo history before importing
        clear();

        // Import the graph with preserved GRC options/metadata
        importGraph(
          result.nodes,
          result.edges,
          result.grcOptions,
          result.grcMetadata
        );

        // Show warnings if any
        if (result.warnings.length > 0) {
          alert(`File loaded with warnings:\n\n${result.warnings.join("\n")}`);
        }
      } catch (error) {
        console.error("Failed to open file:", error);
        alert(
          `Failed to open file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };

    input.click();
  };

  const handleSave = () => {
    try {
      // Export graph to GRC YAML format
      const yaml = exportGraphToGRC(nodes, edges, {
        grcOptions,
        grcMetadata,
      });

      // Create blob and download
      const blob = new Blob([yaml], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flowgraph.grc";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save file:", error);
      alert(
        `Failed to save file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const isUndoAvailable = past.length > 0;
  const isRedoAvailable = future.length > 0;
  const hasContent = nodes.length > 0 || edges.length > 0;

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={handleNew}>New</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleOpen}>
            Open <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={handleSave}>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled={!isUndoAvailable} onClick={undo}>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled={!isRedoAvailable} onClick={redo}>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled={!hasContent} onClick={handleNew}>
            Clear All
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default Menu;

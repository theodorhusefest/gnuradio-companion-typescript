import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useGraphStore } from "@/stores/graphStore";
import {
  useTemporalActions,
  useTemporalStore,
} from "@/stores/useTemporalStore";

const Menu = () => {
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
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open <MenubarShortcut>⌘O</MenubarShortcut>
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
            Redo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled={!isRedoAvailable} onClick={handleClearGraph}>
            Clear
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default Menu;

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAutoLayout } from "@/hooks/useAutoLayout";
import { useClipboard } from "@/hooks/useClipboard";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useGraphStore } from "@/stores/graphStore";
import {
  AlignStartVertical,
  Clipboard,
  ClipboardCopy,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";

// Detect if user is on Mac for keyboard shortcut display
const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

interface CanvasContextMenuProps {
  children: React.ReactNode;
  rotateSelected: (angle: number) => void;
}

export function CanvasContextMenu({
  children,
  rotateSelected,
}: CanvasContextMenuProps) {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const clipboard = useClipboardStore((state) => state.clipboard);
  const { copy, cut, paste, deleteSelected } = useClipboard();
  const { autoLayout, canLayout } = useAutoLayout();

  const hasSelection = useMemo(() => {
    return (
      nodes.some((node) => node.selected) || edges.some((edge) => edge.selected)
    );
  }, [nodes, edges]);

  const hasClipboard = clipboard !== null && clipboard.nodes.length > 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={cut} disabled={!hasSelection}>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>{isMac ? "⌘X" : "Ctrl+X"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={copy} disabled={!hasSelection}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>{isMac ? "⌘C" : "Ctrl+C"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={paste} disabled={!hasClipboard}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>{isMac ? "⌘V" : "Ctrl+V"}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => rotateSelected(90)}
          disabled={!hasSelection}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Rotate Clockwise
          <ContextMenuShortcut>R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => rotateSelected(-90)}
          disabled={!hasSelection}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Rotate Counterclockwise
          <ContextMenuShortcut>⇧R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => autoLayout()} disabled={!canLayout}>
          <AlignStartVertical className="mr-2 h-4 w-4" />
          Auto Layout
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={deleteSelected}
          disabled={!hasSelection}
          variant="destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>{isMac ? "⌫" : "Del"}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

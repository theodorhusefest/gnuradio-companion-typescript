import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import { useCallback, useEffect } from "react";

interface KeyboardShortcutActions {
  copy: () => void;
  cut: () => void;
  paste: () => void;
  deleteSelected: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const nodes = useGraphStore((state) => state.nodes);
  const updateNode = useGraphStore((state) => state.updateNode);
  const { takeSnapshot } = useTemporalActions();

  const { copy, cut, paste, deleteSelected } = actions;

  const rotateSelected = useCallback(
    (angle: number) => {
      const selectedNodes = nodes.filter((node) => node.selected);
      if (selectedNodes.length === 0) return;

      takeSnapshot();
      selectedNodes.forEach((node) => {
        const currentRotation = node.data.rotation || 0;
        const newRotation = (currentRotation + angle + 360) % 360;
        updateNode(node.id, { rotation: newRotation });
      });
    },
    [nodes, updateNode, takeSnapshot],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isModifier = event.metaKey || event.ctrlKey;

      // Copy: Cmd/Ctrl + C
      if (isModifier && event.key === "c") {
        event.preventDefault();
        copy();
      }

      // Cut: Cmd/Ctrl + X
      if (isModifier && event.key === "x") {
        event.preventDefault();
        cut();
      }

      // Paste: Cmd/Ctrl + V
      if (isModifier && event.key === "v") {
        event.preventDefault();
        paste();
      }

      // Delete: Delete or Backspace (without modifier)
      if (
        !isModifier &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        // Only handle if not typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          deleteSelected();
        }
      }

      // Rotate: R (clockwise) or Shift+R (counterclockwise)
      if (!isModifier && (event.key === "r" || event.key === "R")) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          if (event.shiftKey) {
            rotateSelected(-90);
          } else {
            rotateSelected(90);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copy, cut, paste, deleteSelected, rotateSelected]);

  return { rotateSelected };
}

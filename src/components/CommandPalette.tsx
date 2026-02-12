import blocksData from "@/blocks/blocks.json";
import type { BlocksData, GnuRadioBlock } from "@/blocks/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { createBlockNode } from "@/lib/blockUtils";
import { useGraphStore } from "@/stores/graphStore";
import { useTemporalActions } from "@/stores/useTemporalStore";
import { FolderOpen, Save } from "lucide-react";
import { useEffect, useState } from "react";

const blocks = blocksData as BlocksData;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const nodes = useGraphStore((state) => state.nodes);
  const setNodes = useGraphStore((state) => state.setNodes);
  const { takeSnapshot } = useTemporalActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectBlock = (block: GnuRadioBlock) => {
    const newNode = createBlockNode(block, { x: 200, y: 200 });
    takeSnapshot();
    setNodes([...nodes, newNode]);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search blocks and actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              console.log("Save");
              setOpen(false);
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </CommandItem>
          <CommandItem
            onSelect={() => {
              console.log("Open");
              setOpen(false);
            }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {Object.entries(blocks.blocksByCategory)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryBlocks]) => (
            <CommandGroup key={category} heading={category}>
              {categoryBlocks.map((block) => (
                <CommandItem
                  key={block.id}
                  value={`${block.label} ${block.id}`}
                  onSelect={() => handleSelectBlock(block)}
                >
                  <span className="font-medium">{block.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {block.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
    </CommandDialog>
  );
}

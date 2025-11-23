import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Search } from "lucide-react";
import type { BlocksData, GnuRadioBlock } from "@/blocks/types";
import blocksData from "@/blocks/blocks.json";

const blocks = blocksData as BlocksData;

type CategoryBlocksProps = {
  category: string;
  categoryBlocks: GnuRadioBlock[];
  searchQuery: string;
};

function CategoryBlocks({
  category,
  categoryBlocks,
  searchQuery,
}: CategoryBlocksProps) {
  const filteredBlocks = useMemo(() => {
    if (!searchQuery) return categoryBlocks;

    const query = searchQuery.toLowerCase();
    return categoryBlocks.filter(
      (block) =>
        block.label.toLowerCase().includes(query) ||
        block.id.toLowerCase().includes(query)
    );
  }, [categoryBlocks, searchQuery]);

  // Auto-expand if search matches any blocks in this category
  const [isOpen, setIsOpen] = useState(false);

  // Update open state when search changes
  useMemo(() => {
    if (searchQuery && filteredBlocks.length > 0) {
      setIsOpen(true);
    } else if (!searchQuery) {
      setIsOpen(false);
    }
  }, [searchQuery, filteredBlocks.length]);

  if (filteredBlocks.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 hover:bg-accent transition-colors group">
        <ChevronRight
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        <span className="font-medium text-sm">{category}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredBlocks.length}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6">
        {filteredBlocks.map((block) => (
          <div
            key={block.id}
            className="px-4 py-2 hover:bg-accent cursor-pointer transition-colors border-l-2 border-transparent hover:border-primary"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/gnuradio-block",
                JSON.stringify(block)
              );
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            <div className="text-sm font-medium">{block.label}</div>
            <div className="text-xs text-muted-foreground">{block.id}</div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BlocksWindow() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return blocks.blocksByCategory;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, GnuRadioBlock[]> = {};

    Object.entries(blocks.blocksByCategory).forEach(
      ([category, categoryBlocks]) => {
        const matchingBlocks = categoryBlocks.filter(
          (block) =>
            block.label.toLowerCase().includes(query) ||
            block.id.toLowerCase().includes(query)
        );

        if (matchingBlocks.length > 0) {
          filtered[category] = matchingBlocks;
        }
      }
    );

    return filtered;
  }, [searchQuery]);

  return (
    <div className="h-full w-full bg-background border-l flex flex-col overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="py-2">
          {Object.entries(filteredCategories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryBlocks]) => (
              <CategoryBlocks
                key={category}
                category={category}
                categoryBlocks={categoryBlocks}
                searchQuery={searchQuery}
              />
            ))}
          {Object.keys(filteredCategories).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No blocks found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

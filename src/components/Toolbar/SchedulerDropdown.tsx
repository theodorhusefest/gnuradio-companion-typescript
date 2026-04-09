import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const SchedulerDropdown = () => {
  "";
  const setScheduler = (scheduler: string) => {
    console.log(`Choosing scheduler: ${scheduler}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Scheduler X
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setScheduler("scheduler_1")}>
          Scheduler 1
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setScheduler("scheduler_2")}>
          Scheduler 2
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SchedulerDropdown;

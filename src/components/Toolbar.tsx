import LayoutButtons from "./Toolbar/LayoutButtons";
import ModeToggle from "./Toolbar/ModeToggle";
import RotationButtons from "./Toolbar/RotationButtons";
import SchedulerDropdown from "./Toolbar/SchedulerDropdown";
import UndoRedoButtons from "./Toolbar/UndoRedoButtons";

const Toolbar = () => {
  return (
    <div className="border-b bg-background px-4 flex items-center justify-between py-4">
      <div className="space-y-2">
        <h1 className="text-sm font-semibold">GNU Radio 4 GUI</h1>
        <div className="flex gap-2">
          <UndoRedoButtons />
          <RotationButtons />
          <LayoutButtons />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SchedulerDropdown />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Toolbar;

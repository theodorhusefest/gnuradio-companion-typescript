import UndoRedoButtons from "./Toolbar/UndoRedoButtons";
import ModeToggle from "./Toolbar/ModeToggle";

const Toolbar = () => {
  return (
    <div className="border-b bg-background px-4 flex items-center justify-between py-4">
      <div className="space-y-2">
        <h1 className="text-sm font-semibold">GnuRadio Companion</h1>
        <UndoRedoButtons />
      </div>
      <ModeToggle />
    </div>
  );
};

export default Toolbar;

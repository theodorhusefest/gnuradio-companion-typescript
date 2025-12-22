import UndoRedoButtons from "./Toolbar/UndoRedoButtons";
import ModeToggle from "./Toolbar/ModeToggle";
import Menu from "./Toolbar/Menu";

const Toolbar = () => {
  return (
    <div className="border-b bg-background px-4 flex items-center justify-between py-4">
      <div className="space-y-2">
        <Menu />
        <UndoRedoButtons />
      </div>
      <ModeToggle />
    </div>
  );
};

export default Toolbar;

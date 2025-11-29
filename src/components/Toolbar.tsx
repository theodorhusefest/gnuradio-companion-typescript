import UndoRedoButtons from "./Toolbar/UndoRedoButtons";

const Toolbar = () => {
  return (
    <div className="border-b bg-background px-4 flex items-center py-4">
      <div className="space-y-2">
        <h1 className="text-sm font-semibold">GnuRadio Companion</h1>
        <UndoRedoButtons />
      </div>
    </div>
  );
};

export default Toolbar;

import type { BlockParameter } from "@/blocks/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: BlockParameter[];
  nodeId: string;
  onSave: (parameters: Record<string, string | number>) => void;
};

const BlockDetailsDialog = ({
  open,
  onOpenChange,
  parameters,
  nodeId,
  onSave,
}: Props) => {
  const formId = `form-${nodeId}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedParameters: Record<string, string | number> = {};

    parameters.forEach((param) => {
      const value = formData.get(param.id);
      if (value !== null && typeof value === "string") {
        // Convert to number for numeric types
        if (param.dtype === "int" || param.dtype === "float") {
          const numValue = Number(value);
          updatedParameters[param.id] = isNaN(numValue) ? value : numValue;
        } else {
          updatedParameters[param.id] = value;
        }
      }
    });

    onSave(updatedParameters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Parameters</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[50vh] overflow-scroll"
        >
          {parameters.map((param) => (
            <div key={param.id} className="space-y-2">
              <label
                htmlFor={`${nodeId}-${param.id}`}
                className="block font-medium w-1/4 text-sm"
              >
                {param.label}
              </label>
              {param.options && param.options.length > 0 ? (
                <select
                  id={`${nodeId}-${param.id}`}
                  name={param.id}
                  defaultValue={param.default?.toString()}
                  className="w-full px-3 py-2 border rounded"
                >
                  {param.options.map((option, idx) => (
                    <option key={idx} value={option}>
                      {param.option_labels?.[idx] || option}
                    </option>
                  ))}
                </select>
              ) : param.dtype === "int" || param.dtype === "float" ? (
                <input
                  type="number"
                  id={`${nodeId}-${param.id}`}
                  name={param.id}
                  defaultValue={param.default?.toString()}
                  step={param.dtype === "float" ? "any" : "1"}
                  className="w-full px-3 py-2 border rounded"
                />
              ) : (
                <input
                  type="text"
                  id={`${nodeId}-${param.id}`}
                  name={param.id}
                  defaultValue={param.default?.toString()}
                  className="w-full px-3 py-2 border rounded"
                />
              )}
            </div>
          ))}
        </form>

        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button type="submit" form={formId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDetailsDialog;

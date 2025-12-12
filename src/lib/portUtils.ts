import type { BlockPort } from "@/blocks/types";

export const getPortHandleId = (
  port: BlockPort,
  index: number,
  type: "input" | "output"
): string => {
  /**
   * Generate a unique handle ID for a port
   * Uses port.id if available, otherwise port.label (sanitized), otherwise index-based ID
   *
   * @param port - The block port definition
   * @param index - The index of the port in the inputs/outputs array
   * @param type - Whether this is an input or output port
   * @returns A unique handle ID for the port
   *
   * @example
   * // Port with id field
   * getPortHandleId({ domain: 'message', id: 'cmd' }, 0, 'input') // => 'cmd'
   *
   * // Port with label field
   * getPortHandleId({ domain: 'stream', label: 'Trigger Signal' }, 0, 'input') // => 'trigger_signal'
   *
   * // Port with no id or label
   * getPortHandleId({ domain: 'stream', dtype: 'complex' }, 0, 'input') // => 'in0'
   * getPortHandleId({ domain: 'stream', dtype: 'float' }, 1, 'output') // => 'out1'
   */
  if (port.id) {
    return port.id;
  }
  if (port.label) {
    // Sanitize label to make it a valid ID (remove spaces, special chars)
    return port.label.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }
  // Fall back to index-based ID
  return type === "input" ? `in${index}` : `out${index}`;
};

export const getPortColor = (
  port: BlockPort,
  blockDType: string | undefined
): string => {
  const defaultColor = "bg-slate-200";

  if (port.domain === "message") {
    return defaultColor;
  }

  const type = blockDType || port.dtype;
  switch (type) {
    case "complex":
      return "bg-sky-500";
    case "float":
      return "bg-amber-400";
    case "int":
      return "bg-green-400";
    case "short":
      return "bg-yellow-200";
    case "byte":
      return "bg-fuchsia-400";
    default:
      return defaultColor;
  }
};

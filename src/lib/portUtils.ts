import type { BlockPort } from "@/blocks/types";
import type { GraphNode } from "@/types/graph";

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

/**
 * Filters ports based on optional flag and showPorts setting
 */
export function getPorts(
  ports: BlockPort[] | undefined,
  shouldShowPorts: boolean
): BlockPort[] {
  return ports?.filter((port) => !port.optional || shouldShowPorts) ?? [];
}

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

/**
 * Gets the dtype of a specific port from a node by handle ID
 * @param node - The graph node
 * @param handleId - The handle ID of the port
 * @param portType - Whether this is an input or output port
 * @returns The dtype of the port, or undefined if not found
 */
export function getPortDTypeFromNode(
  node: GraphNode | undefined,
  handleId: string,
  portType: "input" | "output"
): string | undefined {
  if (!node) return undefined;

  const ports = portType === "input"
    ? node.data.blockDefinition.inputs
    : node.data.blockDefinition.outputs;

  console.log("ports ", portType, ports)
  if (!ports) return undefined;

  // Find the port by matching handle ID
  const port = ports.find((p, index) => {
    const portHandleId = getPortHandleId(p, index, portType);
    return portHandleId === handleId;
  });

  if (!port) return undefined;

  // If port has dtype directly, return it
  if (port.dtype) return port.dtype;

  // Otherwise, check if block has a 'type' parameter (for parameterized blocks)
  const typeParam = node.data.blockDefinition.parameters?.find((param) => param.id === "type");
  if (!typeParam) return undefined;

  if (typeParam.default !== undefined) {
    return typeParam.default.toString();
  }

  if (typeParam.options && typeParam.options.length > 0) {
    return typeParam.options[0];
  }

  return undefined;
}

/**
 * Determines the edge color based on whether source and target port dtypes match
 * @param sourceDType - The dtype of the source port
 * @param targetDType - The dtype of the target port
 * @returns Color string for the edge (red if mismatch, black if match or both undefined)
 */
export function getEdgeColorFromDTypes(
  sourceDType: string | undefined,
  targetDType: string | undefined
): string {
  // If both are undefined or one is undefined, consider it a match (use default color)
  if (!sourceDType || !targetDType) {
    return "#000";
  }

  // If dtypes don't match, use red
  if (sourceDType !== targetDType) {
    return "#ff0000";
  }

  // If dtypes match, use default black
  return "#000";
}

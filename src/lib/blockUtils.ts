import type { BlockParameter } from "@/types/blocks";

/**
 * Builds a parameter list with current values merged with defaults
 */
export function buildParametersWithValues(
  blockParameters: BlockParameter[] | undefined,
  currentValues: Record<string, string | number | boolean>,
): BlockParameter[] {
  if (!blockParameters) return [];
  return blockParameters.map((param) => ({
    ...param,
    default: currentValues[param.id] ?? param.default,
  }));
}

/**
 * Extracts the block type from parameters
 * If the type parameter has no default but has options, uses the first option
 */
export function getPortDType(parameters: BlockParameter[]): string | undefined {
  const typeParam = parameters.find((param) => param.id === "type");
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
 * Determines if optional ports should be shown based on the showports parameter
 */
export function getShouldShowPorts(parameters: BlockParameter[]): boolean {
  const showPortsParam = parameters.find((param) => param.id === "showports");
  return showPortsParam?.default === "True";
}

/**
 * Calculates the minimum height for a block node based on port count
 */
export function calculateNodeHeight(
  inputCount: number,
  outputCount: number,
  baseHeight = 100,
  portHeight = 40,
): number {
  return baseHeight + portHeight * Math.max(inputCount, outputCount);
}

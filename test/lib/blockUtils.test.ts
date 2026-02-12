import { describe, expect, it } from "vitest";
import {
  buildParametersWithValues,
  calculateNodeHeight,
  createBlockNode,
  getPortDType,
  getShouldShowPorts,
} from "../../src/lib/blockUtils";
import type { BlockParameter, GnuRadioBlock } from "../../src/types/blocks";

describe("blockUtils", () => {
  describe("buildParametersWithValues", () => {
    it("should return empty array when blockParameters is undefined", () => {
      const result = buildParametersWithValues(undefined, {});
      expect(result).toEqual([]);
    });

    it("should return empty array when blockParameters is empty", () => {
      const result = buildParametersWithValues([], {});
      expect(result).toEqual([]);
    });

    it("should merge current values with parameter defaults", () => {
      const blockParameters: BlockParameter[] = [
        { id: "freq", label: "Frequency", dtype: "real", default: 1000 },
        { id: "amp", label: "Amplitude", dtype: "real", default: 1.0 },
      ];
      const currentValues = { freq: 2000 };

      const result = buildParametersWithValues(blockParameters, currentValues);

      expect(result).toHaveLength(2);
      expect(result[0].default).toBe(2000);
      expect(result[1].default).toBe(1.0);
    });

    it("should preserve parameter default when no current value exists", () => {
      const blockParameters: BlockParameter[] = [
        { id: "type", label: "Type", dtype: "enum", default: "complex" },
      ];
      const currentValues = {};

      const result = buildParametersWithValues(blockParameters, currentValues);

      expect(result[0].default).toBe("complex");
    });
  });

  describe("getPortDType", () => {
    it("should return the type parameter value as string", () => {
      const parameters: BlockParameter[] = [
        { id: "freq", label: "Frequency", dtype: "real", default: 1000 },
        { id: "type", label: "Type", dtype: "enum", default: "complex" },
      ];

      const result = getPortDType(parameters);

      expect(result).toBe("complex");
    });

    it("should return undefined when type parameter is not present", () => {
      const parameters: BlockParameter[] = [
        { id: "freq", label: "Frequency", dtype: "real", default: 1000 },
      ];

      const result = getPortDType(parameters);

      expect(result).toBeUndefined();
    });

    it("should convert numeric type values to string", () => {
      const parameters: BlockParameter[] = [
        { id: "type", label: "Type", dtype: "int", default: 42 },
      ];

      const result = getPortDType(parameters);

      expect(result).toBe("42");
    });
  });

  describe("getShouldShowPorts", () => {
    it("should return true when showports parameter is 'True'", () => {
      const parameters: BlockParameter[] = [
        {
          id: "showports",
          label: "Show Ports",
          dtype: "bool",
          default: "True",
        },
      ];

      const result = getShouldShowPorts(parameters);

      expect(result).toBe(true);
    });

    it("should return false when showports parameter is 'False'", () => {
      const parameters: BlockParameter[] = [
        {
          id: "showports",
          label: "Show Ports",
          dtype: "bool",
          default: "False",
        },
      ];

      const result = getShouldShowPorts(parameters);

      expect(result).toBe(false);
    });

    it("should return false when showports parameter is not present", () => {
      const parameters: BlockParameter[] = [
        { id: "freq", label: "Frequency", dtype: "real", default: 1000 },
      ];

      const result = getShouldShowPorts(parameters);

      expect(result).toBe(false);
    });
  });

  describe("calculateNodeHeight", () => {
    it("should return base height when no ports", () => {
      const result = calculateNodeHeight(0, 0);
      expect(result).toBe(100);
    });

    it("should calculate height based on input count when inputs > outputs", () => {
      const result = calculateNodeHeight(3, 1);
      expect(result).toBe(100 + 40 * 3);
    });

    it("should calculate height based on output count when outputs > inputs", () => {
      const result = calculateNodeHeight(1, 5);
      expect(result).toBe(100 + 40 * 5);
    });

    it("should use max when inputs and outputs are equal", () => {
      const result = calculateNodeHeight(2, 2);
      expect(result).toBe(100 + 40 * 2);
    });

    it("should use custom base height and port height", () => {
      const result = calculateNodeHeight(2, 1, 50, 30);
      expect(result).toBe(50 + 30 * 2);
    });
  });

  describe("createBlockNode", () => {
    const mockBlock: GnuRadioBlock = {
      id: "blocks_add_xx",
      label: "Add",
      category: "Math Operators",
      parameters: [
        { id: "type", label: "Type", dtype: "enum", default: "complex" },
        { id: "num_inputs", label: "Num Inputs", dtype: "int", default: 2 },
      ],
      inputs: [{ domain: "stream", dtype: "complex" }],
      outputs: [{ domain: "stream", dtype: "complex" }],
    };

    it("should create a node with correct structure", () => {
      const node = createBlockNode(mockBlock, { x: 100, y: 200 });

      expect(node.id).toMatch(/^node_\d+$/);
      expect(node.type).toBe("block");
      expect(node.position).toEqual({ x: 100, y: 200 });
    });

    it("should initialize parameters with defaults", () => {
      const node = createBlockNode(mockBlock, { x: 0, y: 0 });

      expect(node.data.parameters).toEqual({
        type: "complex",
        num_inputs: 2,
      });
    });

    it("should set instance data fields correctly", () => {
      const node = createBlockNode(mockBlock, { x: 0, y: 0 });

      expect(node.data.blockDefinition).toBe(mockBlock);
      expect(node.data.instanceName).toBe(node.id);
      expect(node.data.enabled).toBe(true);
      expect(node.data.rotation).toBe(0);
      expect(node.data.bus_sink).toBe(false);
      expect(node.data.bus_source).toBe(false);
      expect(node.data.bus_structure).toBeNull();
    });

    it("should handle blocks with no parameters", () => {
      const blockNoParams: GnuRadioBlock = {
        id: "blocks_null_sink",
        label: "Null Sink",
      };

      const node = createBlockNode(blockNoParams, { x: 50, y: 50 });

      expect(node.data.parameters).toEqual({});
    });

    it("should generate unique IDs for each node", () => {
      const node1 = createBlockNode(mockBlock, { x: 0, y: 0 });
      const node2 = createBlockNode(mockBlock, { x: 0, y: 0 });

      expect(node1.id).not.toBe(node2.id);
    });
  });
});

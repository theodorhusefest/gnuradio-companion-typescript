import { describe, expect, it } from "vitest";
import {
  buildParametersWithValues,
  calculateNodeHeight,
  getPortDType,
  getShouldShowPorts,
} from "../../src/lib/blockUtils";
import type { BlockParameter } from "../../src/types/blocks";

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
});

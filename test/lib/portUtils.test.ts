/**
 * Tests for block utilities
 */

import { describe, expect, it } from "vitest";
import type { BlockPort } from "../../src/blocks/types";
import { getPortHandleId, getPorts } from "../../src/lib/portUtils";

describe("blockUtils", () => {
  describe("getPortHandleId", () => {
    it("should use port.id when available", () => {
      const port: BlockPort = {
        domain: "message",
        id: "cmd",
      };
      expect(getPortHandleId(port, 0, "input")).toBe("cmd");
    });

    it("should sanitize port.label when id is not available", () => {
      const port: BlockPort = {
        domain: "stream",
        label: "Trigger Signal",
        dtype: "short",
      };
      expect(getPortHandleId(port, 0, "input")).toBe("trigger_signal");
    });

    it("should handle labels with special characters", () => {
      const port: BlockPort = {
        domain: "stream",
        label: "Input #1 (Main)",
        dtype: "complex",
      };
      expect(getPortHandleId(port, 0, "input")).toBe("input__1__main_");
    });

    it("should use index-based ID for inputs with no id or label", () => {
      const port: BlockPort = {
        domain: "stream",
        dtype: "complex",
      };
      expect(getPortHandleId(port, 0, "input")).toBe("in0");
      expect(getPortHandleId(port, 1, "input")).toBe("in1");
      expect(getPortHandleId(port, 5, "input")).toBe("in5");
    });

    it("should use index-based ID for outputs with no id or label", () => {
      const port: BlockPort = {
        domain: "stream",
        dtype: "float",
      };
      expect(getPortHandleId(port, 0, "output")).toBe("out0");
      expect(getPortHandleId(port, 1, "output")).toBe("out1");
      expect(getPortHandleId(port, 3, "output")).toBe("out3");
    });
  });

  describe("getPorts", () => {
    it("should return empty array when ports is undefined", () => {
      const result = getPorts(undefined, false);
      expect(result).toEqual([]);
    });

    it("should return all ports when shouldShowPorts is true", () => {
      const ports: BlockPort[] = [
        { domain: "stream", dtype: "complex", optional: false },
        { domain: "message", id: "msg", optional: true },
      ];

      const result = getPorts(ports, true);

      expect(result).toHaveLength(2);
    });

    it("should filter out optional ports when shouldShowPorts is false", () => {
      const ports: BlockPort[] = [
        { domain: "stream", dtype: "complex", optional: false },
        { domain: "message", id: "msg", optional: true },
        { domain: "stream", dtype: "float" },
      ];

      const result = getPorts(ports, false);

      expect(result).toHaveLength(2);
      expect(result[0].domain).toBe("stream");
      expect(result[1].dtype).toBe("float");
    });

    it("should return all non-optional ports when shouldShowPorts is false", () => {
      const ports: BlockPort[] = [
        { domain: "stream", dtype: "complex" },
        { domain: "stream", dtype: "float" },
      ];

      const result = getPorts(ports, false);

      expect(result).toHaveLength(2);
    });
  });
});

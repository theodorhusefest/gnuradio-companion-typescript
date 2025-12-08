/**
 * Tests for block utilities
 */

import { describe, it, expect } from "vitest";
import {getPortHandleId} from "../../src/lib/utils";
import type { BlockPort } from "../../src/blocks/types";

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
  })
})

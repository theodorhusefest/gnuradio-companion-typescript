import path from "path";
import { describe, expect, it } from "vitest";
import {
  findBlockFiles,
  getBlockCategory,
  parseBlockFile,
} from "../../scripts/parse-blocks";
import { GnuRadioBlock, ParsedBlock } from "../../src/types/blocks";

describe("parse-blocks", () => {
  // Test fixtures path
  const fixturesPath = path.join(process.cwd(), "test", "fixtures", "blocks");

  describe("getBlockCategory", () => {
    it("should extract category from block with explicit category", () => {
      const block: GnuRadioBlock = {
        id: "test_block",
        label: "Test Block",
        category: "Signal Processing",
      };

      expect(getBlockCategory(block)).toBe("Signal Processing");
    });

    it("should remove [Core] prefix from category", () => {
      const block: GnuRadioBlock = {
        id: "analog_agc",
        label: "AGC",
        category: "[Core]/Analog",
      };

      expect(getBlockCategory(block)).toBe("Analog");
    });

    it("should remove any bracketed prefix from category", () => {
      const block: GnuRadioBlock = {
        id: "test_block",
        label: "Test",
        category: "[Custom]/Filters/Low Pass",
      };

      expect(getBlockCategory(block)).toBe("Filters/Low Pass");
    });

    it("should derive category from block ID when category is missing", () => {
      const block: GnuRadioBlock = {
        id: "analog_agc_xx",
        label: "AGC",
      };

      expect(getBlockCategory(block)).toBe("Analog");
    });

    it("should handle single-word IDs", () => {
      const block: GnuRadioBlock = {
        id: "qtgui_waterfall",
        label: "Waterfall",
      };

      expect(getBlockCategory(block)).toBe("Qtgui");
    });
  });

  describe("parseBlockFile", () => {
    it("should parse a valid block file", () => {
      const validBlockPath = path.join(fixturesPath, "valid_block.block.yml");
      const block = parseBlockFile(validBlockPath);

      expect(block).not.toBeNull();
      expect(block?.id).toBe("analog_agc_xx");
      expect(block?.label).toBe("AGC");
      expect(block?.category).toBe("[Core]/Analog");
      expect(block?.flags).toEqual(["python", "cpp"]);
    });

    it("should parse block parameters correctly", () => {
      const validBlockPath = path.join(fixturesPath, "valid_block.block.yml");
      const block = parseBlockFile(validBlockPath);

      expect(block?.parameters).toHaveLength(1);
      expect(block?.parameters?.[0]).toMatchObject({
        id: "type",
        label: "Type",
        dtype: "enum",
        default: "complex",
        options: ["complex", "float"],
        option_labels: ["Complex", "Float"],
      });
    });

    it("should parse block inputs and outputs", () => {
      const validBlockPath = path.join(fixturesPath, "valid_block.block.yml");
      const block = parseBlockFile(validBlockPath);

      expect(block?.inputs).toHaveLength(1);
      expect(block?.inputs?.[0]).toMatchObject({
        domain: "stream",
        dtype: "${ type }",
      });

      expect(block?.outputs).toHaveLength(1);
      expect(block?.outputs?.[0]).toMatchObject({
        domain: "stream",
        dtype: "${ type }",
      });
    });

    it("should parse block templates", () => {
      const validBlockPath = path.join(fixturesPath, "valid_block.block.yml");
      const block = parseBlockFile(validBlockPath);

      expect(block?.templates).toMatchObject({
        imports: "from gnuradio import analog",
        make: "analog.agc_xx(${type})",
      });
    });

    it("should return null for invalid block file (missing required fields)", () => {
      const invalidBlockPath = path.join(
        fixturesPath,
        "invalid_block.block.yml",
      );
      const block = parseBlockFile(invalidBlockPath);

      expect(block).toBeNull();
    });

    it("should return null for non-existent file", () => {
      const nonExistentPath = path.join(fixturesPath, "does_not_exist.yml");
      const block = parseBlockFile(nonExistentPath);

      expect(block).toBeNull();
    });

    it("should parse nested block file", () => {
      const nestedBlockPath = path.join(
        fixturesPath,
        "subfolder",
        "nested_block.block.yml",
      );
      const block = parseBlockFile(nestedBlockPath);

      expect(block).not.toBeNull();
      expect(block?.id).toBe("blocks_throttle");
      expect(block?.label).toBe("Throttle");
      expect(block?.category).toBe("Miscellaneous");
    });
  });

  describe("findBlockFiles", () => {
    it("should find all .block.yml files in directory", () => {
      const files = findBlockFiles(fixturesPath);

      expect(files).toHaveLength(3);
      expect(files.some((f) => f.endsWith("valid_block.block.yml"))).toBe(true);
      expect(files.some((f) => f.endsWith("invalid_block.block.yml"))).toBe(
        true,
      );
      expect(files.some((f) => f.endsWith("nested_block.block.yml"))).toBe(
        true,
      );
    });

    it("should not include non-.block.yml files", () => {
      const files = findBlockFiles(fixturesPath);

      expect(files.some((f) => f.endsWith("not_a_block.txt"))).toBe(false);
    });

    it("should recursively find files in subdirectories", () => {
      const files = findBlockFiles(fixturesPath);
      const nestedFile = files.find((f) => f.includes("subfolder"));

      expect(nestedFile).toBeDefined();
      expect(nestedFile).toContain("nested_block.block.yml");
    });

    it("should return empty array for non-existent directory", () => {
      const nonExistentPath = path.join(fixturesPath, "does_not_exist");
      const files = findBlockFiles(nonExistentPath);

      expect(files).toEqual([]);
    });

    it("should return empty array for directory with no block files", () => {
      // Create a temporary empty directory for testing
      const emptyDir = path.join(fixturesPath, "empty");
      const files = findBlockFiles(emptyDir);

      expect(files).toEqual([]);
    });

    it("should return absolute paths", () => {
      const files = findBlockFiles(fixturesPath);

      files.forEach((file) => {
        expect(path.isAbsolute(file)).toBe(true);
      });
    });
  });

  describe("integration: parse all fixture blocks", () => {
    it("should successfully parse valid blocks from fixtures", () => {
      const files = findBlockFiles(fixturesPath);
      const blocks: ParsedBlock[] = [];

      for (const file of files) {
        const block = parseBlockFile(file);
        if (block) {
          blocks.push(block);
        }
      }

      // Should have 2 valid blocks (valid_block and nested_block)
      expect(blocks).toHaveLength(2);

      // Verify all blocks have required fields
      blocks.forEach((block) => {
        expect(block.id).toBeDefined();
        expect(block.label).toBeDefined();
        expect(typeof block.id).toBe("string");
        expect(typeof block.label).toBe("string");
      });
    });

    it("should correctly categorize all parsed blocks", () => {
      const files = findBlockFiles(fixturesPath);
      const categories = new Set<string>();

      for (const file of files) {
        const block = parseBlockFile(file);
        if (block) {
          const category = getBlockCategory(block);
          categories.add(category);
        }
      }

      // Should have 2 unique categories
      expect(categories.size).toBe(2);
      expect(categories.has("Analog")).toBe(true);
      expect(categories.has("Miscellaneous")).toBe(true);
    });
  });
});

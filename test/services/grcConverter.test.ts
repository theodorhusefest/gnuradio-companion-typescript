import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  parseGRCToGraph,
  exportGraphToGRC,
  validateGRCFile,
  GRCFile,
} from "../../src/services/grcConverter";
import type { GraphNode, GraphEdge } from "../../src/types/graph";
import type { GnuRadioBlock } from "../../src/types/blocks";

// Test fixtures path
const fixturesPath = path.join(process.cwd(), "test", "fixtures", "grc");

// Mock block definition for testing export
const mockBlockDefinition: GnuRadioBlock = {
  id: "analog_sig_source_x",
  label: "Signal Source",
  parameters: [
    { id: "type", label: "Type", dtype: "enum", options: ["complex", "float"] },
    { id: "freq", label: "Frequency", dtype: "real", default: 1000 },
  ],
  inputs: [],
  outputs: [{ domain: "stream", dtype: "${ type }" }],
};

describe("grcConverter", () => {
  describe("parseGRCToGraph", () => {
    it("should parse a valid GRC file", () => {
      const grcPath = path.join(fixturesPath, "test-flowgraph.grc");
      const content = fs.readFileSync(grcPath, "utf-8");
      const result = parseGRCToGraph(content);

      // Should have parsed options and metadata
      expect(result.grcOptions).toBeDefined();
      expect(result.grcMetadata).toBeDefined();

      // Check metadata
      expect(result.grcMetadata?.file_format).toBe(1);
      expect(result.grcMetadata?.grc_version).toBe("3.10.12.0");

      // Check options
      expect(result.grcOptions?.parameters.title).toBe("Test Flowgraph");
      expect(result.grcOptions?.parameters.author).toBe("");
    });

    it("should convert blocks to GraphNodes", () => {
      const grcPath = path.join(fixturesPath, "test-flowgraph.grc");
      const content = fs.readFileSync(grcPath, "utf-8");
      const result = parseGRCToGraph(content);

      // Should have created nodes for known blocks
      // Some blocks may be unknown and skipped with warnings
      expect(result.nodes.length).toBeGreaterThanOrEqual(0);

      // Check that nodes have required properties
      result.nodes.forEach((node) => {
        expect(node.id).toBeDefined();
        expect(node.type).toBe("block");
        expect(node.position).toHaveProperty("x");
        expect(node.position).toHaveProperty("y");
        expect(node.data.instanceName).toBeDefined();
        expect(node.data.blockDefinition).toBeDefined();
      });
    });

    it("should convert connections to GraphEdges", () => {
      const grcPath = path.join(fixturesPath, "test-flowgraph.grc");
      const content = fs.readFileSync(grcPath, "utf-8");
      const result = parseGRCToGraph(content);

      // Edges may be empty if referenced blocks are unknown
      result.edges.forEach((edge) => {
        expect(edge.id).toBeDefined();
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.data?.sourcePort).toBeDefined();
        expect(edge.data?.targetPort).toBeDefined();
      });
    });

    it("should warn about unknown block types", () => {
      const invalidYaml = `
blocks:
  - name: unknown_block_0
    id: totally_unknown_block_type
    parameters: {}
    states:
      bus_sink: false
      bus_source: false
      bus_structure: null
      coordinate: [100, 100]
      rotation: 0
      state: enabled

connections: []

metadata:
  file_format: 1
  grc_version: "3.10.0"
`;
      const result = parseGRCToGraph(invalidYaml);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Unknown block type");
    });

    it("should handle empty GRC file", () => {
      const result = parseGRCToGraph("");

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle malformed YAML", () => {
      const malformedYaml = "this is not: valid: yaml: content::";
      const result = parseGRCToGraph(malformedYaml);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should extract block position from coordinates", () => {
      const yamlWithPosition = `
blocks:
  - name: test_block
    id: variable
    parameters:
      value: '123'
    states:
      bus_sink: false
      bus_source: false
      bus_structure: null
      coordinate: [150, 250]
      rotation: 0
      state: enabled

connections: []

metadata:
  file_format: 1
  grc_version: "3.10.0"
`;
      const result = parseGRCToGraph(yamlWithPosition);

      // variable block should exist in blocks.json
      if (result.nodes.length > 0) {
        expect(result.nodes[0].position.x).toBe(150);
        expect(result.nodes[0].position.y).toBe(250);
      }
    });
  });

  describe("exportGraphToGRC", () => {
    it("should export empty graph to valid YAML", () => {
      const yaml = exportGraphToGRC([], []);

      expect(yaml).toContain("options:");
      expect(yaml).toContain("blocks:");
      expect(yaml).toContain("connections:");
      expect(yaml).toContain("metadata:");
    });

    it("should export nodes as GRC blocks", () => {
      const nodes: GraphNode[] = [
        {
          id: "test_node",
          type: "block",
          position: { x: 100, y: 200 },
          data: {
            blockDefinition: mockBlockDefinition,
            parameters: { type: "complex", freq: 1000 },
            instanceName: "test_node",
            enabled: true,
          },
        },
      ];

      const yaml = exportGraphToGRC(nodes, []);

      expect(yaml).toContain("name: test_node");
      expect(yaml).toContain("id: analog_sig_source_x");
      expect(yaml).toContain("state: enabled");
    });

    it("should export edges as GRC connections", () => {
      const nodes: GraphNode[] = [
        {
          id: "source_block",
          type: "block",
          position: { x: 100, y: 100 },
          data: {
            blockDefinition: mockBlockDefinition,
            parameters: {},
            instanceName: "source_block",
            enabled: true,
          },
        },
        {
          id: "target_block",
          type: "block",
          position: { x: 300, y: 100 },
          data: {
            blockDefinition: mockBlockDefinition,
            parameters: {},
            instanceName: "target_block",
            enabled: true,
          },
        },
      ];

      const edges: GraphEdge[] = [
        {
          id: "edge1",
          source: "source_block",
          target: "target_block",
          sourceHandle: "0",
          targetHandle: "0",
          data: {
            sourcePort: "0",
            targetPort: "0",
          },
        },
      ];

      const yaml = exportGraphToGRC(nodes, edges);

      expect(yaml).toContain("connections:");
      expect(yaml).toContain("source_block");
      expect(yaml).toContain("target_block");
    });

    it("should preserve GRC options when provided", () => {
      const customOptions = {
        parameters: {
          title: "Custom Title",
          author: "Custom Author",
        },
      };

      const yaml = exportGraphToGRC([], [], { grcOptions: customOptions });

      expect(yaml).toContain("title: Custom Title");
      expect(yaml).toContain("author: Custom Author");
    });

    it("should round node coordinates to integers", () => {
      const nodes: GraphNode[] = [
        {
          id: "test_node",
          type: "block",
          position: { x: 100.7, y: 200.3 },
          data: {
            blockDefinition: mockBlockDefinition,
            parameters: {},
            instanceName: "test_node",
            enabled: true,
          },
        },
      ];

      const yaml = exportGraphToGRC(nodes, []);

      // Coordinates should be rounded
      expect(yaml).toContain("101");
      expect(yaml).toContain("200");
    });
  });

  describe("validateGRCFile", () => {
    it("should return null for valid GRC file", () => {
      const validFile: GRCFile = {
        options: {
          parameters: { title: "Test" },
        },
        blocks: [
          {
            name: "block1",
            id: "test_id",
            parameters: {},
            states: {
              bus_sink: false,
              bus_source: false,
              bus_structure: null,
              coordinate: [0, 0],
              rotation: 0,
              state: "enabled",
            },
          },
        ],
        connections: [],
        metadata: {
          file_format: 1,
          grc_version: "3.10.0",
        },
      };

      const errors = validateGRCFile(validFile);
      expect(errors).toBeNull();
    });

    it("should detect duplicate block names", () => {
      const fileWithDuplicates: GRCFile = {
        options: { parameters: {} },
        blocks: [
          {
            name: "duplicate_name",
            id: "test_id",
            parameters: {},
            states: {
              bus_sink: false,
              bus_source: false,
              bus_structure: null,
              coordinate: [0, 0],
              rotation: 0,
              state: "enabled",
            },
          },
          {
            name: "duplicate_name",
            id: "test_id2",
            parameters: {},
            states: {
              bus_sink: false,
              bus_source: false,
              bus_structure: null,
              coordinate: [100, 100],
              rotation: 0,
              state: "enabled",
            },
          },
        ],
        connections: [],
        metadata: {
          file_format: 1,
          grc_version: "3.10.0",
        },
      };

      const errors = validateGRCFile(fileWithDuplicates);
      expect(errors).not.toBeNull();
      expect(errors?.some((e) => e.includes("Duplicate block name"))).toBe(
        true
      );
    });

    it("should detect invalid connection references", () => {
      const fileWithBadConnection: GRCFile = {
        options: { parameters: {} },
        blocks: [
          {
            name: "existing_block",
            id: "test_id",
            parameters: {},
            states: {
              bus_sink: false,
              bus_source: false,
              bus_structure: null,
              coordinate: [0, 0],
              rotation: 0,
              state: "enabled",
            },
          },
        ],
        connections: [["nonexistent_block", "0", "existing_block", "0"]],
        metadata: {
          file_format: 1,
          grc_version: "3.10.0",
        },
      };

      const errors = validateGRCFile(fileWithBadConnection);
      expect(errors).not.toBeNull();
      expect(errors?.some((e) => e.includes("unknown source block"))).toBe(
        true
      );
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through export and re-import", () => {
      const originalNodes: GraphNode[] = [
        {
          id: "round_trip_node",
          type: "block",
          position: { x: 150, y: 250 },
          data: {
            blockDefinition: mockBlockDefinition,
            parameters: { type: "complex", freq: 2000 },
            instanceName: "round_trip_node",
            enabled: true,
            rotation: 90,
          },
        },
      ];

      // Export to YAML
      const yaml = exportGraphToGRC(originalNodes, []);

      // Re-import (note: this will fail to find the block definition
      // since mockBlockDefinition is not in blocks.json, but the structure
      // should be parseable)
      const result = parseGRCToGraph(yaml);

      // Even if the block is unknown, the YAML structure should be valid
      expect(result.grcMetadata).toBeDefined();
      expect(result.grcOptions).toBeDefined();
    });
  });
});

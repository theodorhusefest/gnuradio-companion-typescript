/**
 * GRC File Converter
 *
 * Service for converting between GRC YAML format and graph state
 */

import yaml from "js-yaml";
import type { GraphNode, GraphEdge } from "../types/graph";
import type { GnuRadioBlock, BlocksData } from "../types/blocks";
import blocksData from "../blocks/blocks.json";
import { getPortHandleId } from "../lib/utils";

const blocks = blocksData as BlocksData;

// Create a lookup map for block definitions by ID
const blockDefinitionMap = new Map<string, GnuRadioBlock>();
blocks.blocks.forEach((block) => {
  blockDefinitionMap.set(block.id, block);
});

/**
 * Convert a GRC port identifier to an app handle ID
 * GRC uses index-based strings like '0', '1' for most ports
 *
 * @param grcPortId - The port ID from the GRC file (e.g., '0', '1', or a named port)
 * @param blockDef - The block definition to look up port info
 * @param portType - Whether this is an input or output port
 * @returns The app handle ID (e.g., 'in0', 'out1', 'cmd', etc.)
 */
function grcPortToHandleId(
  grcPortId: string,
  blockDef: GnuRadioBlock,
  portType: "input" | "output"
): string {
  const ports = portType === "input" ? blockDef.inputs : blockDef.outputs;

  // Try to parse as a numeric index
  const portIndex = parseInt(grcPortId, 10);
  if (!isNaN(portIndex) && ports && ports[portIndex]) {
    return getPortHandleId(ports[portIndex], portIndex, portType);
  }

  // If it's not a numeric index, it might already be a port ID or label
  // Try to find a matching port by id or label
  if (ports) {
    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      if (port.id === grcPortId) {
        return getPortHandleId(port, i, portType);
      }
      if (port.label && port.label.toLowerCase().replace(/[^a-z0-9]/g, "_") === grcPortId) {
        return getPortHandleId(port, i, portType);
      }
    }
  }

  // Fall back to the original ID if we can't match it
  return grcPortId;
}

/**
 * Convert an app handle ID back to a GRC port identifier
 *
 * @param handleId - The app handle ID (e.g., 'in0', 'out1', 'cmd')
 * @param blockDef - The block definition to look up port info
 * @param portType - Whether this is an input or output port
 * @returns The GRC port ID (usually a string index like '0')
 */
function handleIdToGrcPort(
  handleId: string,
  blockDef: GnuRadioBlock,
  portType: "input" | "output"
): string {
  const ports = portType === "input" ? blockDef.inputs : blockDef.outputs;

  if (!ports) {
    return handleId;
  }

  // Find the port that matches this handle ID
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    const expectedHandleId = getPortHandleId(port, i, portType);
    if (expectedHandleId === handleId) {
      return String(i);
    }
  }

  // If no match found, return the original (might already be an index)
  return handleId;
}

/**
 * GRC File Format Types
 * Based on the structure from GRC files
 */

export type GRCOptions = {
  parameters: Record<string, string | number | boolean>;
  states?: {
    bus_sink: boolean;
    bus_source: boolean;
    bus_structure: string | null;
    coordinate: [number, number];
    rotation: number;
    state: string;
  };
};

export type GRCBlock = {
  name: string;
  id: string;
  parameters: Record<string, string | number | boolean>;
  states: {
    bus_sink: boolean;
    bus_source: boolean;
    bus_structure: string | null;
    coordinate: [number, number];
    rotation: number;
    state: string;
  };
};

// GRC connections are arrays: [source_block, source_port, target_block, target_port]
export type GRCConnection = [string, string, string, string];

export type GRCMetadata = {
  file_format: number;
  grc_version: string;
};

export type GRCFile = {
  options: GRCOptions;
  blocks: GRCBlock[];
  connections: GRCConnection[];
  metadata: GRCMetadata;
};

/**
 * Result type for parse operations
 */
export type ParseResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  grcOptions?: GRCOptions;
  grcMetadata?: GRCMetadata;
  warnings: string[];
};

/**
 * Parse a GRC YAML file into graph nodes and edges
 *
 * @param yamlContent - Raw YAML content as string
 * @returns Object containing nodes, edges, GRC options/metadata, and warnings
 */
export function parseGRCToGraph(yamlContent: string): ParseResult {
  const warnings: string[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Parse YAML
  let grcFile: GRCFile;
  try {
    grcFile = yaml.load(yamlContent) as GRCFile;
  } catch (e) {
    console.error("Failed to parse YAML:", e);
    warnings.push(`Failed to parse YAML: ${e instanceof Error ? e.message : String(e)}`);
    return { nodes: [], edges: [], warnings };
  }

  if (!grcFile) {
    warnings.push("Empty or invalid GRC file");
    return { nodes: [], edges: [], warnings };
  }

  // Extract options and metadata
  const grcOptions = grcFile.options;
  const grcMetadata = grcFile.metadata;

  // Convert blocks to GraphNodes
  const grcBlocks = grcFile.blocks || [];
  for (const block of grcBlocks) {
    // Look up block definition
    const blockDefinition = blockDefinitionMap.get(block.id);

    if (!blockDefinition) {
      warnings.push(`Unknown block type: ${block.id} (instance: ${block.name}). Skipping.`);
      continue;
    }

    // Extract position from states.coordinate
    const coordinate = block.states?.coordinate || [0, 0];
    const position = {
      x: coordinate[0],
      y: coordinate[1],
    };

    // Create GraphNode
    const node: GraphNode = {
      id: block.name,
      type: "block",
      position,
      data: {
        blockDefinition,
        parameters: block.parameters || {},
        instanceName: block.name,
        enabled: block.states?.state === "enabled",
        comment: block.parameters?.comment as string | undefined,
        affinity: block.parameters?.affinity as string | undefined,
        alias: block.parameters?.alias as string | undefined,
        bus_sink: block.states?.bus_sink,
        bus_source: block.states?.bus_source,
        bus_structure: block.states?.bus_structure,
        rotation: block.states?.rotation,
      },
    };

    nodes.push(node);
  }

  // Create a map of node names to their block definitions for port lookup
  const nodeBlockDefMap = new Map<string, GnuRadioBlock>();
  for (const node of nodes) {
    nodeBlockDefMap.set(node.id, node.data.blockDefinition);
  }

  // Convert connections to GraphEdges
  const grcConnections = grcFile.connections || [];
  for (const connection of grcConnections) {
    // Connection format: [source_block, source_port, target_block, target_port]
    const [sourceName, grcSourcePort, targetName, grcTargetPort] = connection;

    // Validate that source and target blocks exist
    const sourceBlockDef = nodeBlockDefMap.get(sourceName);
    const targetBlockDef = nodeBlockDefMap.get(targetName);

    if (!sourceBlockDef) {
      warnings.push(`Connection references unknown source block: ${sourceName}. Skipping.`);
      continue;
    }
    if (!targetBlockDef) {
      warnings.push(`Connection references unknown target block: ${targetName}. Skipping.`);
      continue;
    }

    // Convert GRC port IDs to app handle IDs
    const sourceHandle = grcPortToHandleId(grcSourcePort, sourceBlockDef, "output");
    const targetHandle = grcPortToHandleId(grcTargetPort, targetBlockDef, "input");

    // Create GraphEdge
    const edge: GraphEdge = {
      id: `${sourceName}-${sourceHandle}-${targetName}-${targetHandle}`,
      source: sourceName,
      target: targetName,
      sourceHandle,
      targetHandle,
      data: {
        sourcePort: sourceHandle,
        targetPort: targetHandle,
      },
    };

    edges.push(edge);
  }

  return {
    nodes,
    edges,
    grcOptions,
    grcMetadata,
    warnings,
  };
}

/**
 * Default GRC options for new flowgraphs
 */
function getDefaultGRCOptions(): GRCOptions {
  return {
    parameters: {
      author: "",
      catch_exceptions: "True",
      category: "[GRC Hier Blocks]",
      cmake_opt: "",
      comment: "",
      copyright: "",
      description: "",
      gen_cmake: "On",
      gen_linking: "dynamic",
      generate_options: "qt_gui",
      hier_block_src_path: ".:",
      id: "untitled",
      max_nouts: "0",
      output_language: "python",
      placement: "(0,0)",
      qt_qss_theme: "",
      realtime_scheduling: "",
      run: "True",
      run_command: "{python} -u {filename}",
      run_options: "prompt",
      sizing_mode: "fixed",
      thread_safe_setters: "",
      title: "Untitled",
      window_size: "(1000,1000)",
    },
    states: {
      bus_sink: false,
      bus_source: false,
      bus_structure: null,
      coordinate: [8, 8],
      rotation: 0,
      state: "enabled",
    },
  };
}

/**
 * Default GRC metadata
 */
function getDefaultGRCMetadata(): GRCMetadata {
  return {
    file_format: 1,
    grc_version: "3.10.12.0",
  };
}

/**
 * Export graph nodes and edges to GRC YAML format
 *
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param options - GRC options (preserved from loaded file or defaults)
 * @param metadata - GRC metadata (preserved from loaded file or defaults)
 * @returns YAML string in GRC format
 */
export function exportGraphToGRC(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options?: {
    grcOptions?: GRCOptions;
    grcMetadata?: GRCMetadata;
  }
): string {
  // Use preserved options/metadata or defaults
  const grcOptions = options?.grcOptions || getDefaultGRCOptions();
  const grcMetadata = options?.grcMetadata || getDefaultGRCMetadata();

  // Convert GraphNodes to GRCBlocks
  const grcBlocks: GRCBlock[] = nodes.map((node) => ({
    name: node.data.instanceName,
    id: node.data.blockDefinition.id,
    parameters: node.data.parameters,
    states: {
      bus_sink: node.data.bus_sink ?? false,
      bus_source: node.data.bus_source ?? false,
      bus_structure: node.data.bus_structure ?? null,
      coordinate: [Math.round(node.position.x), Math.round(node.position.y)] as [number, number],
      rotation: node.data.rotation ?? 0,
      state: node.data.enabled ? "enabled" : "disabled",
    },
  }));

  // Create a map of node names to their block definitions for port lookup
  const nodeBlockDefMap = new Map<string, GnuRadioBlock>();
  for (const node of nodes) {
    nodeBlockDefMap.set(node.data.instanceName, node.data.blockDefinition);
  }

  // Convert GraphEdges to GRCConnections
  const grcConnections: GRCConnection[] = edges.map((edge) => {
    const sourceBlockDef = nodeBlockDefMap.get(edge.source);
    const targetBlockDef = nodeBlockDefMap.get(edge.target);

    const sourceHandle = edge.data?.sourcePort || edge.sourceHandle || "0";
    const targetHandle = edge.data?.targetPort || edge.targetHandle || "0";

    // Convert app handle IDs to GRC port indices
    const grcSourcePort = sourceBlockDef
      ? handleIdToGrcPort(sourceHandle, sourceBlockDef, "output")
      : sourceHandle;
    const grcTargetPort = targetBlockDef
      ? handleIdToGrcPort(targetHandle, targetBlockDef, "input")
      : targetHandle;

    return [edge.source, grcSourcePort, edge.target, grcTargetPort];
  });

  // Build GRC file structure
  const grcFile: GRCFile = {
    options: grcOptions,
    blocks: grcBlocks,
    connections: grcConnections,
    metadata: grcMetadata,
  };

  // Serialize to YAML with flow style for nested arrays (coordinates, connections)
  return yaml.dump(grcFile, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: true, // Don't use YAML references
    sortKeys: false, // Preserve key order
    flowLevel: 3, // Use flow style for arrays nested 3+ levels deep (coordinate, connections items)
  });
}

/**
 * Validate a GRC file structure
 *
 * @param grcFile - Parsed GRC file object
 * @returns Array of validation errors or null if valid
 */
export function validateGRCFile(grcFile: GRCFile): string[] | null {
  const errors: string[] = [];

  // Check required fields
  if (!grcFile.options) {
    errors.push("Missing 'options' block");
  }

  if (!grcFile.blocks) {
    errors.push("Missing 'blocks' array");
  }

  if (!grcFile.metadata) {
    errors.push("Missing 'metadata' block");
  }

  // Validate block names are unique
  if (grcFile.blocks) {
    const blockNames = new Set<string>();
    for (const block of grcFile.blocks) {
      if (blockNames.has(block.name)) {
        errors.push(`Duplicate block name: ${block.name}`);
      }
      blockNames.add(block.name);
    }

    // Validate connections reference valid blocks
    if (grcFile.connections) {
      for (const connection of grcFile.connections) {
        const [sourceName, , targetName] = connection;
        if (!blockNames.has(sourceName)) {
          errors.push(`Connection references unknown source block: ${sourceName}`);
        }
        if (!blockNames.has(targetName)) {
          errors.push(`Connection references unknown target block: ${targetName}`);
        }
      }
    }
  }

  return errors.length > 0 ? errors : null;
}

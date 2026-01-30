#!/usr/bin/env node
/**
 * GNU Radio Block Parser
 *
 * This script scans the GNU Radio block directories and parses all .block.yml files
 * to generate TypeScript types and a blocks.json file for the application.
 */
import * as fs from "fs";
import * as yaml from "js-yaml";
import os from "os";
import * as path from "path";
import type {
  BlocksByCategory,
  BlocksData,
  GnuRadioBlock,
} from "../src/types/blocks.js";

// Configuration
function getGnuRadioPackagePath() {
  const platform = os.platform();
  switch (platform) {
    case "darwin":
      return "/opt/homebrew/share/gnuradio/grc/blocks";
    case "linux":
      return "/usr/share/gnuradio/grc/blocks";
    default:
      throw new Error("Gnu-Radio path not implemented for this OS");
  }
}
const BLOCK_PATHS = [
  getGnuRadioPackagePath(),
  path.join(process.env.HOME || "", ".local/state/gnuradio"),
];

const OUTPUT_DIR = path.join(process.cwd(), "src", "blocks");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "blocks.json");
const OUTPUT_TYPES = path.join(OUTPUT_DIR, "types.ts");

/**
 * Recursively find all .block.yml files in a directory
 */
export function findBlockFiles(dir: string): string[] {
  const blockFiles: string[] = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`);
    return blockFiles;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      blockFiles.push(...findBlockFiles(filePath));
    } else if (file.endsWith(".block.yml")) {
      blockFiles.push(filePath);
    }
  }

  return blockFiles;
}

/**
 * Parse a single block YAML file
 */
export function parseBlockFile(filePath: string): GnuRadioBlock | null {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(content) as GnuRadioBlock;

    if (!data.id || !data.label) {
      console.warn(`Skipping invalid block file: ${filePath}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract category from block data or derive from ID
 */
export function getBlockCategory(block: GnuRadioBlock): string {
  if (block.category) {
    // Remove special category prefixes like '[Core]/'
    return block.category.replace(/^\[.*?\]\//, "");
  }

  // Derive category from block ID (e.g., "analog_agc_xx" -> "Analog")
  const prefix = block.id.split("_")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Scanning for GNU Radio blocks...\n");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find all block files
  const allBlockFiles: string[] = [];
  for (const blockPath of BLOCK_PATHS) {
    console.log(`Scanning: ${blockPath}`);
    const files = findBlockFiles(blockPath);
    console.log(`  Found ${files.length} block files`);
    allBlockFiles.push(...files);
  }

  console.log(`\n📦 Total block files found: ${allBlockFiles.length}\n`);

  // Parse all blocks
  const blocks: GnuRadioBlock[] = [];
  const blocksByCategory: BlocksByCategory = {};

  for (const filePath of allBlockFiles) {
    const block = parseBlockFile(filePath);
    if (block) {
      blocks.push(block);

      const category = getBlockCategory(block);
      if (!blocksByCategory[category]) {
        blocksByCategory[category] = [];
      }
      blocksByCategory[category].push(block);
    }
  }

  console.log(`✅ Successfully parsed ${blocks.length} blocks`);
  console.log(`📁 Categories: ${Object.keys(blocksByCategory).length}\n`);

  // Show category breakdown
  const categoryStats = Object.entries(blocksByCategory)
    .map(([category, blocks]) => ({ category, count: blocks.length }))
    .sort((a, b) => b.count - a.count);

  console.log("Category breakdown:");
  for (const { category, count } of categoryStats) {
    console.log(`  ${category.padEnd(20)} ${count} blocks`);
  }

  // Write blocks.json
  const output: BlocksData = {
    generated_at: new Date().toISOString(),
    total_blocks: blocks.length,
    categories: Object.keys(blocksByCategory).sort(),
    blocks: blocks,
    blocksByCategory: blocksByCategory,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  console.log(`\n✨ Generated: ${OUTPUT_JSON}`);

  // Generate TypeScript types (re-export from main types file)
  const typesContent = `/**
 * GNU Radio Block Types
 *
 * Auto-generated on ${new Date().toISOString()}
 * Total blocks: ${blocks.length}
 *
 * Note: This file re-exports types from @/types/blocks
 * Import directly from @/types/blocks for better type inference
 */

export type {
  BlockParameter,
  BlockPort,
  BlockTemplates,
  CppTemplates,
  GnuRadioBlock,
  BlocksByCategory,
  BlocksData,
} from '@/types/blocks';
`;

  fs.writeFileSync(OUTPUT_TYPES, typesContent);
  console.log(`✨ Generated: ${OUTPUT_TYPES}`);

  console.log("\n🎉 Block parsing complete!\n");
}

// Run the script
main();

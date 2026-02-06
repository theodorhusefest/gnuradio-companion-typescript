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
function getGnuRadioPackagePaths(): string[] {
  const platform = os.platform();
  const paths: string[] = [];

  switch (platform) {
    case "darwin":
      paths.push("/opt/homebrew/share/gnuradio/grc/blocks");
      break;
    case "linux":
      paths.push("/usr/share/gnuradio/grc/blocks");
      break;
    default:
      console.warn(`GNU Radio path not configured for platform: ${platform}`);
  }

  paths.push(path.join(process.env.HOME || "", ".local/state/gnuradio"));
  return paths;
}

const BLOCK_PATHS = getGnuRadioPackagePaths();

const OUTPUT_DIR = path.join(process.cwd(), "src", "blocks");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "blocks.json");
const OUTPUT_TYPES = path.join(OUTPUT_DIR, "types.ts");
const FIXTURE_PATH = path.join(OUTPUT_DIR, "blocks-fixture.json");

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

  // If no blocks found, use fixture for CI/testing environments
  if (allBlockFiles.length === 0) {
    console.log("⚠️  No GNU Radio blocks found on system.");
    if (fs.existsSync(FIXTURE_PATH)) {
      console.log("📋 Using fixture data for CI/testing...");
      fs.copyFileSync(FIXTURE_PATH, OUTPUT_JSON);
      console.log(`✨ Copied fixture to: ${OUTPUT_JSON}`);

      // Generate types file for consistency
      const fixtureData = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
      const typesContent = `/**
 * GNU Radio Block Types
 *
 * Total blocks: ${fixtureData.total_blocks}
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
      console.log("\n🎉 Block parsing complete (using fixture)!\n");
      return;
    } else {
      console.error("❌ No fixture found at:", FIXTURE_PATH);
      process.exit(1);
    }
  }

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

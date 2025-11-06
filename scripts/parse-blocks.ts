#!/usr/bin/env node
/**
 * GNU Radio Block Parser
 *
 * This script scans the GNU Radio block directories and parses all .block.yml files
 * to generate TypeScript types and a blocks.json file for the application.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Configuration
const BLOCK_PATHS = [
  '/opt/homebrew/share/gnuradio/grc/blocks',
  path.join(process.env.HOME || '', '.local/state/gnuradio'),
];

const OUTPUT_DIR = path.join(process.cwd(), 'src', 'blocks');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'blocks.json');
const OUTPUT_TYPES = path.join(OUTPUT_DIR, 'types.ts');

// Types for parsed blocks
interface BlockParameter {
  id: string;
  label: string;
  dtype: string;
  default?: any;
  options?: any[];
  option_labels?: string[];
  option_attributes?: Record<string, any>;
  hide?: string;
}

interface BlockPort {
  domain: string;
  dtype: string;
  vlen?: number | string;
  multiplicity?: number | string;
  optional?: boolean;
}

interface BlockTemplates {
  imports?: string;
  make?: string;
  callbacks?: string[];
}

interface ParsedBlock {
  id: string;
  label: string;
  category?: string;
  flags?: string[];
  parameters?: BlockParameter[];
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  templates?: BlockTemplates;
  cpp_templates?: any;
  documentation?: string;
  file_format?: number;
}

interface BlocksByCategory {
  [category: string]: ParsedBlock[];
}

/**
 * Recursively find all .block.yml files in a directory
 */
function findBlockFiles(dir: string): string[] {
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
    } else if (file.endsWith('.block.yml')) {
      blockFiles.push(filePath);
    }
  }

  return blockFiles;
}

/**
 * Parse a single block YAML file
 */
function parseBlockFile(filePath: string): ParsedBlock | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as ParsedBlock;

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
function getBlockCategory(block: ParsedBlock): string {
  if (block.category) {
    // Remove special category prefixes like '[Core]/'
    return block.category.replace(/^\[.*?\]\//, '');
  }

  // Derive category from block ID (e.g., "analog_agc_xx" -> "Analog")
  const prefix = block.id.split('_')[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for GNU Radio blocks...\n');

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
  const blocks: ParsedBlock[] = [];
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

  console.log('Category breakdown:');
  for (const { category, count } of categoryStats) {
    console.log(`  ${category.padEnd(20)} ${count} blocks`);
  }

  // Write blocks.json
  const output = {
    generated_at: new Date().toISOString(),
    total_blocks: blocks.length,
    categories: Object.keys(blocksByCategory).sort(),
    blocks: blocks,
    blocksByCategory: blocksByCategory,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  console.log(`\n✨ Generated: ${OUTPUT_JSON}`);

  // Generate TypeScript types
  const typesContent = `/**
 * GNU Radio Block Types
 *
 * Auto-generated on ${new Date().toISOString()}
 * Total blocks: ${blocks.length}
 */

export interface BlockParameter {
  id: string;
  label: string;
  dtype: string;
  default?: any;
  options?: any[];
  option_labels?: string[];
  option_attributes?: Record<string, any>;
  hide?: string;
}

export interface BlockPort {
  domain: string;
  dtype?: string;
  id?: string;
  label?: string;
  vlen?: number | string;
  multiplicity?: number | string;
  optional?: boolean | string;
}

export interface BlockTemplates {
  imports?: string;
  make?: string;
  callbacks?: string[];
}

export interface GnuRadioBlock {
  id: string;
  label: string;
  category?: string;
  flags?: string[];
  parameters?: BlockParameter[];
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  templates?: BlockTemplates;
  cpp_templates?: any;
  documentation?: string;
  file_format?: number;
}

export interface BlocksData {
  generated_at: string;
  total_blocks: number;
  categories: string[];
  blocks: GnuRadioBlock[];
  blocksByCategory: Record<string, GnuRadioBlock[]>;
}
`;

  fs.writeFileSync(OUTPUT_TYPES, typesContent);
  console.log(`✨ Generated: ${OUTPUT_TYPES}`);

  console.log('\n🎉 Block parsing complete!\n');
}

// Run the script
main();

/**
 * GNU Radio Block Types
 *
 * Type definitions for GNU Radio blocks parsed from .block.yml files
 */
export type BlockParameter = {
  id: string;
  label: string;
  dtype: string;
  default?: string | number | boolean;
  options?: string[];
  option_labels?: string[];
  option_attributes?: Record<string, string[] | number[] | string | number>;
  hide?: string;
};

export type BlockPort = {
  domain: string;
  dtype?: string;
  id?: string;
  label?: string;
  vlen?: number | string;
  multiplicity?: number | string;
  optional?: boolean | string;
};

export type BlockTemplates = {
  imports?: string;
  make?: string;
  callbacks?: string[];
};

export type CppTemplates = {
  includes?: string[];
  declarations?: string;
  make?: string;
  var_make?: string;
  callbacks?: string[];
  link?: string[];
  translations?: Record<string, string>;
};

export type ParsedBlock = {
  id: string;
  label: string;
  category?: string;
  flags?: string[];
  parameters?: BlockParameter[];
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  templates?: BlockTemplates;
  cpp_templates?: CppTemplates;
  documentation?: string;
  file_format?: number;
};

export type BlocksByCategory = {
  [category: string]: ParsedBlock[];
};

export type GnuRadioBlock = ParsedBlock;

export type BlocksData = {
  generated_at: string;
  total_blocks: number;
  categories: string[];
  blocks: GnuRadioBlock[];
  blocksByCategory: BlocksByCategory;
};

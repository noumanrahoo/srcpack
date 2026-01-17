// SPDX-License-Identifier: MIT

import { homedir } from "node:os";
import { join } from "node:path";
import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";

export function expandPath(p: string): string {
  if (p.startsWith("~/")) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

const PatternsSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

const BundleConfigSchema = z.union([
  z.string().min(1), // "src/**/*"
  z.array(z.string().min(1)).min(1), // ["src/**/*", "!src/specs"]
  z.object({
    include: PatternsSchema,
    outfile: z.string().optional(),
    index: z.boolean().default(true), // Include index header in output
  }),
]);

const UploadConfigSchema = z.object({
  provider: z.literal("gdrive"),
  folderId: z.string().optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

const ConfigSchema = z.object({
  outDir: z.string().default(".srcpack"),
  upload: z
    .union([UploadConfigSchema, z.array(UploadConfigSchema).min(1)])
    .optional(),
  bundles: z.record(z.string(), BundleConfigSchema),
});

export type UploadConfig = z.infer<typeof UploadConfigSchema>;
export type BundleConfig = z.infer<typeof BundleConfigSchema>;
export type BundleConfigInput = z.input<typeof BundleConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type ConfigInput = z.input<typeof ConfigSchema>;

export function defineConfig(config: ConfigInput): ConfigInput {
  return config;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function parseConfig(value: unknown): Config {
  const result = ConfigSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0]!;
    const path = issue.path.join(".");
    const message = path ? `${path}: ${issue.message}` : issue.message;
    throw new ConfigError(message);
  }

  const config = result.data;
  config.outDir = expandPath(config.outDir);

  for (const bundle of Object.values(config.bundles)) {
    if (
      typeof bundle === "object" &&
      !Array.isArray(bundle) &&
      bundle.outfile
    ) {
      bundle.outfile = expandPath(bundle.outfile);
    }
  }

  return config;
}

const explorer = cosmiconfig("srcpack", {
  searchPlaces: [
    "srcpack.config.ts", // Primary: full TypeScript support with Bun
    "srcpack.config.js", // Fallback for JS-only projects
    "package.json", // Zero-file option via "srcpack" field
  ],
});

export async function loadConfig(searchFrom?: string): Promise<Config | null> {
  const result = await explorer.search(searchFrom);
  if (!result) return null;
  return parseConfig(result.config);
}

export async function loadConfigFromFile(
  filepath: string,
): Promise<Config | null> {
  const result = await explorer.load(filepath);
  if (!result) return null;
  return parseConfig(result.config);
}

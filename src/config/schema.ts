import { z } from "zod";

/**
 * Zod schema for the Generator configuration.
 *
 * Validated at the CLI boundary before any file generation begins.
 * Invalid configurations are rejected with clear error messages before
 * the filesystem is touched.
 */
export const GeneratorConfigSchema = z.object({
  project: z.object({
    /** Human-readable project name — e.g. "FMS Automation" */
    name: z.string().min(1, "Project name is required"),

    /** Organisation — e.g. "SIMS Education" */
    organisation: z.string().min(1, "Organisation is required"),

    /** Full application name — used in generated headings and descriptions */
    applicationName: z.string().min(1, "Application name is required"),

    /** Optional short description — defaults to a generated string */
    description: z.string().optional(),
  }),

  automation: z
    .object({
      /** Automation scope: browser UI, HTTP API, or both */
      type: z.enum(["ui", "api", "both"]).default("ui"),
    })
    .default({}),

  environments: z
    .object({
      /** List of environment names — generates one .env.{name}.example per entry */
      names: z.array(z.string().min(1)).min(1).default(["uat"]),

      /** Default environment used when TEST_ENV is not set */
      default: z.string().default("uat"),
    })
    .default({}),
});

export type GeneratorConfig = z.infer<typeof GeneratorConfigSchema>;

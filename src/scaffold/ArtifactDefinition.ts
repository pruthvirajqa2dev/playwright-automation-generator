import type { ScaffoldContext } from "./ScaffoldContext";

/**
 * ArtifactDefinition — the contract for a scaffoldable artefact.
 *
 * Each registered artefact describes everything the platform needs to:
 *   1. Register a CLI subcommand under `pw-gen add`
 *   2. Resolve the correct EJS template
 *   3. Derive the output path from user input
 *   4. Display correct banners and next-step guidance after generation
 *
 * The platform (CLI, Scaffolder) derives all artefact-specific behaviour from
 * this definition. Adding a new artefact requires only a new `ArtifactDefinition`
 * registered with the `ArtifactRegistry` — no changes to CLI logic or Scaffolder.
 */
export interface ArtifactDefinition {
  /**
   * The command name used in `pw-gen add <command>`.
   * Examples: "page", "test", "component"
   */
  command: string;

  /**
   * Human-readable label used in CLI generation banners.
   * Examples: "Page Object", "Test File", "Component Object"
   */
  label: string;

  /**
   * Template filename relative to `src/modules/scaffold/templates/`.
   * Example: "page.ts.ejs"
   */
  templateFile: string;

  /**
   * Derives the output path (relative to the framework root) from the resolved
   * `ScaffoldContext`. All naming conventions are applied here, not in templates.
   *
   * @example (ctx) => `src/pages/${ctx.name}Page.ts`
   */
  outputPath: (context: ScaffoldContext) => string;

  /**
   * Derives the artefact display name shown in the CLI generation banner.
   * This is the generated class or file name — not the raw input.
   *
   * @example (ctx) => `${ctx.name}Page`
   */
  displayName: (context: ScaffoldContext) => string;

  /**
   * Short description shown in `pw-gen add --help`.
   * Should start with a verb: "Scaffold a new …"
   */
  description: string;

  /**
   * Usage example appended to `description` in `pw-gen add --help`.
   * The artefact name only — no command prefix.
   * Example: "Supplier" (shown as "pw-gen add page Supplier")
   */
  example: string;

  /**
   * Success headline displayed after generation completes.
   * Example: "Page Object generated successfully!"
   */
  successTitle: string;

  /**
   * Produces the next-steps guidance shown after successful generation.
   * Lines should be indented with four spaces to align with the CLI banner.
   *
   * @param context    - Resolved `ScaffoldContext` for the generated artefact.
   * @param outputPath - Relative path of the generated file within the framework.
   */
  nextSteps: (context: ScaffoldContext, outputPath: string) => string;
}

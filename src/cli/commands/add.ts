import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import { Scaffolder } from "../../scaffold/Scaffolder";
import { buildScaffoldContext } from "../../scaffold/ScaffoldContext";
import { artifactRegistry } from "../../scaffold/ArtifactRegistry";
import type { ArtifactDefinition } from "../../scaffold/ArtifactDefinition";

/**
 * Registers the "add" command group: pw-gen add page | test | component
 *
 * Commands are resolved from the ArtifactRegistry — no artefact knowledge is
 * hardcoded here. Adding a new artefact requires only a new ArtifactDefinition
 * registered in ArtifactRegistry; this file requires no modification.
 *
 * Usage:
 *   pw-gen add page <Name>       [--output <dir>] [--force]
 *   pw-gen add test <Name>       [--output <dir>] [--force]
 *   pw-gen add component <Name>  [--output <dir>] [--force]
 *
 * Options:
 *   --output <dir>  Framework root directory (defaults to current directory)
 *   --force         Overwrite existing files without confirmation
 *
 * Examples:
 *   pw-gen add page Supplier
 *   pw-gen add test SupplierSearch --output ./Generated/playwright-fms
 *   pw-gen add component SearchPanel
 *   pw-gen add page InvoiceSearch --force
 */
export function registerAddCommand(program: Command): void {
  const add = program
    .command("add")
    .description(
      "Scaffold a new artefact into an existing generated framework",
    );

  for (const definition of artifactRegistry.all()) {
    add
      .command(`${definition.command} <name>`)
      .description(
        `${definition.description}\n` +
          `  Example: pw-gen add ${definition.command} ${definition.example}`,
      )
      .option(
        "--output <dir>",
        "Framework root directory (default: current directory)",
      )
      .option(
        "--force",
        "Overwrite an existing file without confirmation",
        false,
      )
      .action(createAction(definition));
  }
}

/**
 * Produces an async action handler for a given artefact definition.
 * The banner, success message, and next-steps text are all derived from the
 * definition — no artefact-specific logic lives in this function.
 */
function createAction(definition: ArtifactDefinition) {
  return async (
    rawName: string,
    options: { output?: string; force: boolean },
  ): Promise<void> => {
    try {
      const frameworkDir = resolveFrameworkDir(options.output);
      assertFrameworkExists(frameworkDir);

      const context = buildScaffoldContext(rawName);
      const separator = "─".repeat(55);

      console.log(`
${separator}
  pw-gen  —  Scaffolding ${definition.label}
${separator}
  Name     : ${definition.displayName(context)}
  Output   : ${frameworkDir}
${separator}`);

      const scaffolder = new Scaffolder();
      const outputPath = await scaffolder.scaffold(
        definition,
        rawName,
        frameworkDir,
        options.force,
      );

      console.log(`
  ${definition.successTitle}

  File     : ${outputPath}

  Next steps:
${definition.nextSteps(context, outputPath)}
${separator}
`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n  Error: ${message}`);
      process.exit(1);
    }
  };
}

/**
 * Resolves the framework root directory from the --output option or CWD.
 */
function resolveFrameworkDir(output?: string): string {
  return output ? path.resolve(output) : process.cwd();
}

/**
 * Asserts that the given directory contains a generated Playwright framework
 * by checking for the presence of playwright.config.ts.
 *
 * Fails with a clear message if the framework is not found.
 */
function assertFrameworkExists(frameworkDir: string): void {
  const configPath = path.join(frameworkDir, "playwright.config.ts");
  if (!fs.existsSync(configPath)) {
    console.error(
      `\n  Error: No Playwright framework found at: ${frameworkDir}\n` +
        `  Expected: ${configPath}\n\n` +
        `  Generate a framework first:\n` +
        `    pw-gen new --name "My Project" --org "My Org" --app "My App"\n\n` +
        `  Or specify the framework directory:\n` +
        `    pw-gen add page <Name> --output ./Generated/playwright-fms\n`,
    );
    process.exit(1);
  }
}

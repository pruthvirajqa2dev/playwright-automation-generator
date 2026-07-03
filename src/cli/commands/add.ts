import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import { Scaffolder } from "../../scaffold/Scaffolder";
import { buildScaffoldContext } from "../../scaffold/ScaffoldContext";

/**
 * Registers the "add" command group: pw-gen add page | test
 *
 * These commands scaffold individual artefacts into an existing generated
 * framework. They reuse the TemplateRenderer and FileWriter from the engine.
 *
 * Usage:
 *   pw-gen add page <Name>  [--output <dir>] [--force]
 *   pw-gen add test <Name>  [--output <dir>] [--force]
 *
 * Options:
 *   --output <dir>  Framework root directory (defaults to current directory)
 *   --force         Overwrite existing files without confirmation
 *
 * Examples:
 *   pw-gen add page Supplier
 *   pw-gen add test SupplierSearch --output ./Generated/playwright-fms
 *   pw-gen add page InvoiceSearch --force
 */
export function registerAddCommand(program: Command): void {
  const add = program
    .command("add")
    .description(
      "Scaffold a new artefact into an existing generated framework",
    );

  // ── pw-gen add page <Name> ────────────────────────────────────────────────
  add
    .command("page <name>")
    .description(
      "Scaffold a new Page Object extending BasePage\n" +
        "  Example: pw-gen add page Supplier",
    )
    .option(
      "--output <dir>",
      "Framework root directory (default: current directory)",
    )
    .option("--force", "Overwrite an existing file without confirmation", false)
    .action(
      async (rawName: string, options: { output?: string; force: boolean }) => {
        try {
          const frameworkDir = resolveFrameworkDir(options.output);
          assertFrameworkExists(frameworkDir);

          const context = buildScaffoldContext(rawName);
          const separator = "─".repeat(55);

          console.log(`
${separator}
  pw-gen  —  Scaffolding Page Object
${separator}
  Name     : ${context.name}Page
  Output   : ${frameworkDir}
${separator}`);

          const scaffolder = new Scaffolder();
          const outputPath = await scaffolder.scaffoldPage(
            rawName,
            frameworkDir,
            options.force,
          );

          console.log(`
  Page Object generated successfully!

  File     : ${outputPath}

  Next steps:
    1.  Update locators in ${outputPath}
    2.  Implement business methods
    3.  Import in a test:
          import { ${context.name}Page } from '../pages/${context.name}Page';
${separator}
`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`\n  Error: ${message}`);
          process.exit(1);
        }
      },
    );

  // ── pw-gen add test <Name> ────────────────────────────────────────────────
  add
    .command("test <name>")
    .description(
      "Scaffold a new Playwright test file\n" +
        "  Example: pw-gen add test SupplierSearch",
    )
    .option(
      "--output <dir>",
      "Framework root directory (default: current directory)",
    )
    .option("--force", "Overwrite an existing file without confirmation", false)
    .action(
      async (rawName: string, options: { output?: string; force: boolean }) => {
        try {
          const frameworkDir = resolveFrameworkDir(options.output);
          assertFrameworkExists(frameworkDir);

          const context = buildScaffoldContext(rawName);
          const separator = "─".repeat(55);

          console.log(`
${separator}
  pw-gen  —  Scaffolding Test File
${separator}
  Name     : ${context.slug}.spec.ts
  Output   : ${frameworkDir}
${separator}`);

          const scaffolder = new Scaffolder();
          const outputPath = await scaffolder.scaffoldTest(
            rawName,
            frameworkDir,
            options.force,
          );

          console.log(`
  Test file generated successfully!

  File     : ${outputPath}

  Next steps:
    1.  Add your Page Object import (see TODO comments)
    2.  Implement test steps
    3.  Run the test:
          npx playwright test ${outputPath}
${separator}
`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`\n  Error: ${message}`);
          process.exit(1);
        }
      },
    );
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

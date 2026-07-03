import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import { GeneratorConfigSchema } from "../../config/schema";
import { Assembler } from "../../engine/Assembler";
import { toSlug } from "../../utils/string";

/**
 * Registers the "new" command: pw-gen new
 *
 * Accepts either individual flags or a --config JSON file.
 * The --config file takes precedence over all individual flags.
 *
 * Example (flags):
 *   pw-gen new --name "FMS Automation" --org "SIMS Education" \
 *              --app "Financial Management System" \
 *              --output ../Generated/playwright-fms
 *
 * Example (config file):
 *   pw-gen new --config pw-gen.config.json --output ../Generated/playwright-fms
 */
export function registerGenerateCommand(program: Command): void {
  program
    .command("new")
    .description("Generate a new Playwright automation framework")
    .option("--name <name>", 'Project name, e.g. "FMS Automation"')
    .option("--org <org>", 'Organisation name, e.g. "SIMS Education"')
    .option(
      "--app <app>",
      'Application name, e.g. "Financial Management System"',
    )
    .option("--type <type>", "Automation type: ui | api | both", "ui")
    .option("--envs <envs>", "Comma-separated environment names", "uat")
    .option("--default-env <env>", "Default environment name", "uat")
    .option("--output <dir>", "Output directory (default: ./playwright-{slug})")
    .option(
      "--config <file>",
      "Path to pw-gen.config.json (overrides all flags)",
    )
    .action(async (options: Record<string, string>) => {
      try {
        let rawConfig: Record<string, unknown>;

        // ── Source 1: JSON config file ─────────────────────────────────────
        if (options["config"]) {
          const configPath = path.resolve(options["config"]);
          if (!fs.existsSync(configPath)) {
            console.error(`\n  Error: Config file not found: ${configPath}`);
            process.exit(1);
          }
          rawConfig = fs.readJsonSync(configPath) as Record<string, unknown>;
        } else {
          // ── Source 2: CLI flags ──────────────────────────────────────────
          if (!options["name"] || !options["org"] || !options["app"]) {
            console.error(
              "\n  Error: --name, --org, and --app are required when not using --config\n" +
                "  Run: pw-gen new --help",
            );
            process.exit(1);
          }
          const envNames = (options["envs"] ?? "uat")
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean);

          rawConfig = {
            project: {
              name: options["name"],
              organisation: options["org"],
              applicationName: options["app"],
            },
            automation: { type: options["type"] ?? "ui" },
            environments: {
              names: envNames,
              default: options["defaultEnv"] ?? envNames[0] ?? "uat",
            },
          };
        }

        // ── Validate with Zod ──────────────────────────────────────────────
        const parseResult = GeneratorConfigSchema.safeParse(rawConfig);
        if (!parseResult.success) {
          console.error("\n  Configuration errors:");
          for (const issue of parseResult.error.issues) {
            console.error(`    • ${issue.path.join(".")}: ${issue.message}`);
          }
          process.exit(1);
        }
        const config = parseResult.data;

        // ── Resolve output directory ───────────────────────────────────────
        const appSlug = toSlug(config.project.applicationName);
        const outputDir = options["output"]
          ? path.resolve(options["output"])
          : path.resolve(`playwright-${appSlug}`);

        // ── Print summary ──────────────────────────────────────────────────
        const separator = "─".repeat(55);
        console.log(`
${separator}
  pw-gen  v0.1.0  —  Playwright Automation Platform Generator
${separator}
  Project      : ${config.project.name}
  Organisation : ${config.project.organisation}
  Application  : ${config.project.applicationName}
  Type         : ${config.automation.type}
  Environments : ${config.environments.names.join(", ")}
  Output       : ${outputDir}
${separator}`);

        // ── Generate ───────────────────────────────────────────────────────
        const assembler = new Assembler();
        await assembler.assemble(config, outputDir);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n  Error: ${message}`);
        process.exit(1);
      }
    });
}

import type { GeneratorConfig } from "../config/schema";
import { buildContext } from "./ContextBuilder";
import { TemplateRenderer } from "./TemplateRenderer";
import { FileWriter } from "./FileWriter";
import { ModuleRegistry } from "../modules/registry";

/**
 * Assembler — top-level orchestrator for the generation pipeline.
 *
 * Pipeline:
 *   1. Build TemplateContext from GeneratorConfig
 *   2. Resolve the ordered set of modules (core is always first)
 *   3. Render all module templates into StagedFiles (in-memory)
 *   4. Write all StagedFiles to the output directory
 *   5. Print next-steps instructions
 */
export class Assembler {
  private readonly registry = new ModuleRegistry();
  private readonly renderer = new TemplateRenderer();
  private readonly writer = new FileWriter();

  async assemble(config: GeneratorConfig, outputDir: string): Promise<void> {
    console.log("\n  Building context...");
    const context = buildContext(config);

    console.log("  Resolving modules...");
    // Pass [] — the registry prepends all alwaysIncluded modules (i.e. core)
    const modules = this.registry.resolve(config.modules.selected);
    const moduleNames = modules.map((m) => m.name).join(", ");
    console.log(`  Modules: ${moduleNames}`);

    console.log("  Rendering templates...");
    const staged = this.renderer.render(modules, context);
    console.log(`  Files staged: ${staged.length}`);

    console.log(`  Writing to ${outputDir} ...`);
    await this.writer.write(outputDir, staged);

    this.printSuccess(outputDir, moduleNames);
  }

  private printSuccess(outputDir: string, modules: string): void {
    const separator = "─".repeat(55);
    console.log(`
${separator}
  Framework generated successfully!

  Location : ${outputDir}
  Modules  : ${modules}

  Next steps:
    1.  cd ${outputDir}
    2.  npm install
    3.  npx playwright install
    4.  npx playwright test

  The sample test runs against https://playwright.dev
  and verifies the framework compiles and executes correctly.
  Replace src/tests/sample/ with your application tests.
${separator}
`);
  }
}

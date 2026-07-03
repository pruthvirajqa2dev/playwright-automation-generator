import fs from "fs-extra";
import path from "path";
import { TemplateRenderer } from "../engine/TemplateRenderer";
import { FileWriter } from "../engine/FileWriter";
import { buildScaffoldContext, ScaffoldContext } from "./ScaffoldContext";

/**
 * Scaffolder — orchestrates individual artifact generation into an existing
 * generated framework.
 *
 * Reuses the existing engine components:
 *   • TemplateRenderer.renderSingle() — EJS rendering with ScaffoldContext
 *   • FileWriter.write()             — atomic file write to the output directory
 *
 * Overwrite protection: if the target file already exists and force is false,
 * the Scaffolder throws before any write occurs.
 *
 * Scaffold templates live in src/modules/scaffold/templates/:
 *   page.ts.ejs       → src/pages/{Name}Page.ts
 *   test.spec.ts.ejs  → src/tests/{slug}.spec.ts
 */
export class Scaffolder {
  private readonly renderer = new TemplateRenderer();
  private readonly writer = new FileWriter();

  /** Absolute path to the scaffold EJS templates directory. */
  private readonly templateDir = path.join(
    __dirname,
    "..",
    "modules",
    "scaffold",
    "templates",
  );

  /**
   * Scaffold a new Page Object extending BasePage.
   *
   * @param rawName      - Artifact name: "Supplier", "SupplierSearch"
   * @param frameworkDir - Absolute path to the existing generated framework root.
   * @param force        - When true, overwrite an existing file without prompting.
   * @returns            - The relative output path of the generated file.
   */
  async scaffoldPage(
    rawName: string,
    frameworkDir: string,
    force = false,
  ): Promise<string> {
    const context = buildScaffoldContext(rawName);
    const outputPath = `src/pages/${context.name}Page.ts`;

    await this.writeArtifact(
      "page.ts.ejs",
      outputPath,
      context,
      frameworkDir,
      force,
    );

    return outputPath;
  }

  /**
   * Scaffold a new Component Object extending BaseComponent.
   *
   * @param rawName      - Artifact name: "SearchPanel", "InvoiceTable"
   * @param frameworkDir - Absolute path to the existing generated framework root.
   * @param force        - When true, overwrite an existing file without prompting.
   * @returns            - The relative output path of the generated file.
   */
  async scaffoldComponent(
    rawName: string,
    frameworkDir: string,
    force = false,
  ): Promise<string> {
    const context = buildScaffoldContext(rawName);
    const outputPath = `src/components/${context.name}Component.ts`;

    await this.writeArtifact(
      "component.ts.ejs",
      outputPath,
      context,
      frameworkDir,
      force,
    );

    return outputPath;
  }

  /**
   * Scaffold a new Playwright test file.
   *
   * @param rawName      - Artifact name: "SupplierSearch"
   * @param frameworkDir - Absolute path to the existing generated framework root.
   * @param force        - When true, overwrite an existing file without prompting.
   * @returns            - The relative output path of the generated file.
   */
  async scaffoldTest(
    rawName: string,
    frameworkDir: string,
    force = false,
  ): Promise<string> {
    const context = buildScaffoldContext(rawName);
    const outputPath = `src/tests/${context.slug}.spec.ts`;

    await this.writeArtifact(
      "test.spec.ts.ejs",
      outputPath,
      context,
      frameworkDir,
      force,
    );

    return outputPath;
  }

  /**
   * Core scaffold operation: render one template and write one file.
   *
   * @param templateFile - EJS template filename (relative to templateDir).
   * @param outputPath   - Relative path in the generated framework.
   * @param context      - ScaffoldContext to pass to EJS.
   * @param frameworkDir - Absolute path to the framework root.
   * @param force        - Skip overwrite check when true.
   */
  private async writeArtifact(
    templateFile: string,
    outputPath: string,
    context: ScaffoldContext,
    frameworkDir: string,
    force: boolean,
  ): Promise<void> {
    const fullOutputPath = path.join(frameworkDir, outputPath);

    if (!force && fs.existsSync(fullOutputPath)) {
      throw new Error(
        `File already exists: ${fullOutputPath}\n` +
          `  Use --force to overwrite the existing file.`,
      );
    }

    const templatePath = path.join(this.templateDir, templateFile);
    const staged = this.renderer.renderSingle(
      templatePath,
      outputPath,
      context as unknown as Record<string, unknown>,
    );

    await this.writer.write(frameworkDir, [staged]);
  }
}

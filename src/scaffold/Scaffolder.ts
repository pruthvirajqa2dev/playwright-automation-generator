import fs from "fs-extra";
import path from "path";
import { TemplateRenderer } from "../engine/TemplateRenderer";
import { FileWriter } from "../engine/FileWriter";
import { buildScaffoldContext, ScaffoldContext } from "./ScaffoldContext";
import type { ArtifactDefinition } from "./ArtifactDefinition";

/**
 * Scaffolder — orchestrates individual artefact generation into an existing
 * generated framework.
 *
 * Reuses the existing engine components:
 *   • TemplateRenderer.renderSingle() — EJS rendering with ScaffoldContext
 *   • FileWriter.write()             — atomic file write to the output directory
 *
 * Artefact-specific knowledge (template file, output path, naming rules) is no
 * longer hardcoded here. It is supplied at call time via an `ArtifactDefinition`
 * resolved from the `ArtifactRegistry`.
 *
 * Overwrite protection: if the target file already exists and force is false,
 * the Scaffolder throws before any write occurs.
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
   * Scaffold a single artefact described by its registry definition.
   *
   * The definition supplies the template file, output path derivation, and all
   * naming rules — making this method fully generic across artefact types.
   *
   * @param definition   - The artefact definition resolved from `ArtifactRegistry`.
   * @param rawName      - Name as provided by the user; normalised internally to PascalCase.
   * @param frameworkDir - Absolute path to the existing generated framework root.
   * @param force        - When true, overwrite an existing file without prompting.
   * @returns            - The relative output path of the generated file.
   */
  async scaffold(
    definition: ArtifactDefinition,
    rawName: string,
    frameworkDir: string,
    force = false,
  ): Promise<string> {
    const context = buildScaffoldContext(rawName);
    const outputPath = definition.outputPath(context);

    await this.writeArtifact(
      definition.templateFile,
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

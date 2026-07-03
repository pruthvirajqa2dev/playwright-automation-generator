import ejs from "ejs";
import fs from "fs-extra";
import path from "path";
import type { ModuleManifest } from "../modules/types";
import type { TemplateContext } from "./ContextBuilder";

/**
 * An in-memory file ready to be written to the generated framework.
 */
export interface StagedFile {
  /** Path relative to the generated framework root — e.g. "src/config/env.ts" */
  outputPath: string;
  /** Fully rendered content of the file */
  content: string;
}

/**
 * TemplateRenderer — walks a set of module manifests and renders each
 * EJS template with the provided TemplateContext.
 *
 * Returns a list of StagedFiles; does not touch the filesystem.
 */
export class TemplateRenderer {
  render(modules: ModuleManifest[], context: TemplateContext): StagedFile[] {
    const staged: StagedFile[] = [];

    for (const module of modules) {
      for (const file of module.files) {
        const templatePath = path.join(module.templateDir, file.templatePath);

        if (!fs.existsSync(templatePath)) {
          throw new Error(
            `[core] Template not found: ${templatePath}\n` +
              `  Module: ${module.name}\n` +
              `  Template: ${file.templatePath}`,
          );
        }

        const templateSource = fs.readFileSync(templatePath, "utf-8");

        // Render template content
        const content = ejs.render(templateSource, context, {
          filename: templatePath, // enables EJS <%- include() %> support
        });

        // outputPath may itself contain EJS tags (e.g. for dynamic filenames)
        const outputPath = ejs.render(file.outputPath, context);

        staged.push({ outputPath, content });
      }
    }

    return staged;
  }

  /**
   * Renders a single EJS template with the given context object.
   * Used by the Scaffolding Engine to render individual artifact templates
   * without requiring a full ModuleManifest or TemplateContext.
   *
   * @param templatePath - Absolute path to the EJS template file.
   * @param outputPath   - Relative output path in the generated framework.
   * @param context      - Context object passed to EJS (may contain any shape).
   */
  renderSingle(
    templatePath: string,
    outputPath: string,
    context: Record<string, unknown>,
  ): StagedFile {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Scaffold template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const content = ejs.render(templateSource, context, {
      filename: templatePath,
    });

    return { outputPath, content };
  }
}

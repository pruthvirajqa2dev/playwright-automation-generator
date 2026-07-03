import fs from "fs-extra";
import path from "path";
import type { StagedFile } from "./TemplateRenderer";

/**
 * FileWriter — takes a list of StagedFiles and writes them to an output
 * directory, creating any intermediate directories as needed.
 *
 * Existing files are overwritten without prompting.
 * Partial writes are not possible: all files are staged in memory first
 * (by TemplateRenderer) before any disk writes begin.
 */
export class FileWriter {
  async write(outputDir: string, files: StagedFile[]): Promise<void> {
    await fs.ensureDir(outputDir);

    for (const file of files) {
      const fullPath = path.join(outputDir, file.outputPath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, "utf-8");
    }
  }
}

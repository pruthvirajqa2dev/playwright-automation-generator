import type { ArtifactDefinition } from "../ArtifactDefinition";

/**
 * Page Object artefact definition.
 *
 * `pw-gen add page <Name>` → `src/pages/{Name}Page.ts`
 *
 * Generates a concrete Page Object class extending `BasePage`,
 * with a typed constructor, placeholder locators, and stub methods.
 */
export const pageArtifact: ArtifactDefinition = {
  command: "page",
  label: "Page Object",
  templateFile: "page.ts.ejs",
  outputPath: (ctx) => `src/pages/${ctx.name}Page.ts`,
  displayName: (ctx) => `${ctx.name}Page`,
  description: "Scaffold a new Page Object extending BasePage",
  example: "Supplier",
  successTitle: "Page Object generated successfully!",
  nextSteps: (ctx, outputPath) =>
    `    1.  Update locators in ${outputPath}\n` +
    `    2.  Implement business methods\n` +
    `    3.  Import in a test:\n` +
    `          import { ${ctx.name}Page } from '../pages/${ctx.name}Page';`,
};

import type { ArtifactDefinition } from "../ArtifactDefinition";

/**
 * Component Object artefact definition.
 *
 * `pw-gen add component <Name>` → `src/components/{Name}Component.ts`
 *
 * Generates a concrete Component Object class extending `BaseComponent`,
 * with a Locator-scoped constructor, placeholder locators, stub methods,
 * and a JSDoc composition example.
 */
export const componentArtifact: ArtifactDefinition = {
  command: "component",
  label: "Component Object",
  templateFile: "component.ts.ejs",
  outputPath: (ctx) => `src/components/${ctx.name}Component.ts`,
  displayName: (ctx) => `${ctx.name}Component`,
  description: "Scaffold a new Component Object extending BaseComponent",
  example: "SearchPanel",
  successTitle: "Component generated successfully!",
  nextSteps: (ctx, outputPath) =>
    `    1.  Update locators in ${outputPath}\n` +
    `    2.  Implement business methods\n` +
    `    3.  Compose into a Page Object:\n` +
    `          import { ${ctx.name}Component } from '../components/${ctx.name}Component';\n` +
    `          // inside Page Object class:\n` +
    `          readonly ${ctx.camelName} = new ${ctx.name}Component(\n` +
    `            this.page.locator('[data-testid="${ctx.slug}"]'),\n` +
    `            this.testInfo,\n` +
    `          );`,
};

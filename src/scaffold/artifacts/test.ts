import type { ArtifactDefinition } from "../ArtifactDefinition";

/**
 * Test file artefact definition.
 *
 * `pw-gen add test <Name>` → `src/tests/{slug}.spec.ts`
 *
 * Generates a Playwright test file with `test.describe` scaffolding,
 * a fixture import, and TODO stubs for Page Object imports and test steps.
 */
export const testArtifact: ArtifactDefinition = {
  command: "test",
  label: "Test File",
  templateFile: "test.spec.ts.ejs",
  outputPath: (ctx) => `src/tests/${ctx.slug}.spec.ts`,
  displayName: (ctx) => `${ctx.slug}.spec.ts`,
  description: "Scaffold a new Playwright test file",
  example: "SupplierSearch",
  successTitle: "Test file generated successfully!",
  nextSteps: (_ctx, outputPath) =>
    `    1.  Add your Page Object import (see TODO comments)\n` +
    `    2.  Implement test steps\n` +
    `    3.  Run the test:\n` +
    `          npx playwright test ${outputPath}`,
};

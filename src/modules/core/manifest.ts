import path from "path";
import type { ModuleManifest } from "../types";

/**
 * Core module manifest.
 *
 * The core module is always included in every generated framework.
 * It produces the complete structural scaffold: configuration files,
 * the abstract BasePage, an extended test fixture, a Winston logger,
 * a sample Page Object, and one immediately runnable sample test.
 *
 * Every other module builds on top of what core generates.
 */
export const manifest: ModuleManifest = {
  name: "core",
  version: "0.1.0",
  description: "Core Playwright framework scaffold — always included",
  alwaysIncluded: true,
  dependencies: [],
  templateDir: path.join(__dirname, "templates"),

  files: [
    // ── Root configuration ────────────────────────────────────────────────
    {
      templatePath: "playwright.config.ts.ejs",
      outputPath: "playwright.config.ts",
    },
    { templatePath: "tsconfig.json.ejs", outputPath: "tsconfig.json" },
    { templatePath: "package.json.ejs", outputPath: "package.json" },
    { templatePath: ".gitignore.ejs", outputPath: ".gitignore" },
    { templatePath: ".prettierrc.json.ejs", outputPath: ".prettierrc.json" },
    { templatePath: ".env.example.ejs", outputPath: ".env.example" },
    { templatePath: "README.md.ejs", outputPath: "README.md" },

    // ── Framework source ──────────────────────────────────────────────────
    { templatePath: "src/config/env.ts.ejs", outputPath: "src/config/env.ts" },
    {
      templatePath: "src/fixtures/test.ts.ejs",
      outputPath: "src/fixtures/test.ts",
    },
    {
      templatePath: "src/logging/logger.ts.ejs",
      outputPath: "src/logging/logger.ts",
    },
    {
      templatePath: "src/pages/BasePage.ts.ejs",
      outputPath: "src/pages/BasePage.ts",
    },
    {
      templatePath: "src/pages/SamplePage.ts.ejs",
      outputPath: "src/pages/SamplePage.ts",
    },
    {
      templatePath: "src/tests/sample/sample.spec.ts.ejs",
      outputPath: "src/tests/sample/sample.spec.ts",
    },
  ],

  packageDependencies: {
    dependencies: {},
    devDependencies: {
      "@playwright/test": "^1.60.0",
      "@types/node": "^20.14.0",
      "cross-env": "^7.0.3",
      dotenv: "^16.4.5",
      typescript: "^5.7.2",
      winston: "^3.17.0",
    },
  },

  npmScripts: {
    test: "playwright test",
    report: "playwright show-report",
  },
};

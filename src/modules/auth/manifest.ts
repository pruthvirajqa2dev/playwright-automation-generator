import path from "path";
import type { ModuleManifest } from "../types";

/**
 * Auth module manifest.
 *
 * Delivers the storageState-based authentication pattern:
 *   • auth.setup.ts  — authenticates once via UI, persists browser state
 *   • auth.ts        — auth-aware fixture using mergeTests() with core
 *   • playwright/.auth/ directory placeholder (session json files are gitignored)
 *
 * The core playwright.config.ts template is auth-aware: when this module is
 * selected (modules.auth = true), it automatically adds:
 *   • A "setup" project (testMatch: auth.setup.ts)
 *   • dependencies: ["setup"] on all test projects
 *   • storageState: "playwright/.auth/user.json" on all test projects
 *
 * Prerequisites in the generated framework before running tests:
 *   1. LoginPage locators updated for the target application
 *   2. LoginPage.expectLoginSuccess() implemented (currently throws)
 *   3. URL, USERID, PASSWORD set in src/config/.env
 *
 * See ADR-007 for the design decision.
 */
export const manifest: ModuleManifest = {
  name: "auth",
  version: "0.1.0",
  description: "Authentication module — storageState-based session management",
  alwaysIncluded: false,
  dependencies: ["core"],
  templateDir: path.join(__dirname, "templates"),

  files: [
    // Directory placeholder — *.json files are gitignored, generated at runtime
    {
      templatePath: "playwright/.auth/.gitkeep.ejs",
      outputPath: "playwright/.auth/.gitkeep",
    },
    // Setup test — runs once before all test projects to authenticate
    {
      templatePath: "src/tests/auth/auth.setup.ts.ejs",
      outputPath: "src/tests/auth/auth.setup.ts",
    },
    // Auth-aware fixture — merges core fixtures with _authGuard
    {
      templatePath: "src/fixtures/auth.ts.ejs",
      outputPath: "src/fixtures/auth.ts",
    },
  ],

  packageDependencies: {
    dependencies: {},
    devDependencies: {},
  },

  npmScripts: {},
};

# Changelog

All notable changes to pw-gen are documented here.

Format: human-readable milestone summaries focused on user-visible capabilities.
For implementation details, see `docs/DECISIONS.md` and the corresponding ADRs.

---

## [Unreleased]

---

## [0.1.0] — Milestone 1: Enterprise Core Foundation — 2026-07-03

### What changed

This milestone replaced every placeholder and sample artifact in the generated
framework with production-quality equivalents. A framework generated after this
milestone is ready to be used as the starting point for a real enterprise
automation project.

### Generated framework improvements

**`BasePage` — richer helper set**

The abstract base class now covers the complete range of helpers an automation
engineer needs at the start of a project. New additions: waiting for loading
indicators to disappear, waiting for network idle state, toast/alert message
verification, non-throwing visibility checks, scroll-into-view, and an
explicit hidden-element assertion. Every Page Object in the generated framework
gets these helpers automatically by extending `BasePage`.

**`LoginPage` — replaces `SamplePage`**

The sample page that demonstrated framework compilation against `playwright.dev`
has been replaced with a `LoginPage` — a realistic authentication Page Object
template. It demonstrates: private readonly locators, environment-driven
credentials (no hardcoded values), business-oriented methods (`login()`,
`loginWithEnvCredentials()`), and clear adaptation points for the target
application. Engineers modify the locators and implement `expectLoginSuccess()`
for their specific application.

**`login.smoke.spec.ts` — replaces `sample.spec.ts`**

The generated smoke test is now a login smoke test template. It runs out of the
box without application credentials (verifying the base URL is reachable), and
includes a commented-out full login test that engineers uncomment once their
application is configured. The test demonstrates the full stack of framework
conventions: `test.step()`, logger calls, Page Object usage, test annotations,
and screenshot attachment.

**Fixture architecture — typed and extensible**

`fixtures/test.ts` now exports a proper typed fixture extension. Engineers inject
`loginPage` directly via test parameter destructuring. An automatic lifecycle
fixture (`_testLifecycle`) logs test start, pass, and failure for every test
without any test-file changes — engineers see structured log output immediately.
The `AppFixtures` type is exported so future screens can be added following the
same pattern.

**Structured logger**

The Winston logger now produces aligned, padded output with colorized levels
locally and plain-text output in CI. Log level is controlled via `LOG_LEVEL`
in `.env`.

**Self-documenting README**

Every generated framework now includes a comprehensive `README.md` covering:
folder structure, Page Object conventions, test writing guide, fixture usage,
logging levels reference, environment configuration, and CI integration. A new
engineer joining the project can understand the framework by reading this file.

### Generator improvements

**Build script auto-copies templates**

`npm run build` now copies EJS templates from `src/modules/core/templates/` to
`dist/modules/core/templates/` automatically after TypeScript compilation.
Previously, templates had to be copied manually after a clean build — a step
that was easy to miss.

---

## [0.1.0] — Milestone 0: Vertical Slice — 2026-06-15

### What changed

This milestone validated the complete generation pipeline end-to-end for the
first time: one command produces a fully-structured, immediately runnable
Playwright framework.

### Capabilities delivered

**`pw-gen new` command**

A CLI command that accepts project configuration via individual flags
(`--name`, `--org`, `--app`, `--envs`, `--type`, `--output`) or a JSON
configuration file (`--config`). All input is validated before any files
are written. Invalid configuration produces a clear error message.

**Generated framework (13 files)**

Running `pw-gen new` produces a complete Playwright TypeScript project:

- `playwright.config.ts` with environment loading, reporters, and browser projects
- `package.json` with all dependencies and per-environment npm scripts
- Typed `ENV` wrapper (`src/config/env.ts`)
- Winston logger singleton (`src/logging/logger.ts`)
- Abstract `BasePage` (`src/pages/BasePage.ts`)
- Extended Playwright test fixture (`src/fixtures/test.ts`)
- `.env.example`, `.gitignore`, `.prettierrc.json`, `tsconfig.json`, `README.md`

**Verified working**

The generated framework compiles with `tsc --noEmit` (zero errors) and the
included smoke test passes against `https://playwright.dev` without any
application configuration.

**Module system foundation**

`ModuleRegistry` and `ModuleManifest` establish the composable module architecture.
The `core` module is always included; the registry is designed to accommodate
future optional modules (`auth`, `api`, `database`, etc.) without changing
existing code.

**Two-phase generation**

Templates are rendered into memory (`StagedFile[]`) before any disk writes begin.
A template error cannot produce a partially-written output directory.

# Changelog

All notable product capabilities delivered by pw-gen are documented here.

Format: product-focused capability descriptions per release.
For implementation decisions, see [DECISIONS.md](DECISIONS.md) and the [ADR index](adr/).

---

## [Unreleased] — Scaffolding Engine Phase 1

Changes introduced by the Scaffolding Engine sprint. Targets v0.5.

### Generator

**`pw-gen add page <Name>` command**

Scaffolds a production-ready Page Object extending `BasePage` into an existing
generated framework. The generated class includes:

- Constructor with `Page` and `TestInfo` injection (BasePage convention)
- Placeholder locators as private readonly fields with adaptation instructions
- `open()` navigation method with a TODO path placeholder
- `expectOnPage()` assertion method
- Commented business method examples: `search()`, `submit()`, `expectResultCount()`
- Full JSDoc explaining Page Object conventions

Output: `src/pages/{Name}Page.ts`

**`pw-gen add test <Name>` command**

Scaffolds a Playwright test file demonstrating all enterprise framework conventions.
The generated file includes:

- Imports from `fixtures/test` (project-specific fixture set) and `logging/logger`
- Commented Page Object import with a `pw-gen add page` reminder
- `test.describe()` wrapper
- `test()` with `test.info().annotations` for HTML report labelling
- Three `test.step()` blocks: Navigate, Verify, Business Logic
- Logger calls at each step boundary
- Placeholder assertions with `expect()`
- TODO markers and inline guidance at every adaptation point

Output: `src/tests/{slug}.spec.ts`

**Overwrite protection**

Both scaffold commands check for an existing file before writing. A clear error
message is shown if the target already exists, with a `--force` flag to override.

**`--output` flag**

Both commands accept `--output <dir>` to specify the framework root directory.
Defaults to the current working directory. Validates that the target directory
contains a `playwright.config.ts` before proceeding.

### Architecture

**`src/scaffold/` module**

- `ScaffoldContext.ts` — lightweight context interface and `buildScaffoldContext()` builder
- `Scaffolder.ts` — orchestrator for single-artefact scaffold operations; reuses `TemplateRenderer.renderSingle()` and `FileWriter.write()`

**`TemplateRenderer.renderSingle()`**

New method on the existing `TemplateRenderer` that renders a single EJS template
with an arbitrary context object. Used by the Scaffolding Engine without requiring
a full `ModuleManifest` or `TemplateContext`.

**`src/modules/scaffold/templates/`**

New template directory for scaffold artefacts, parallel to the existing module
template directories. Templates follow identical EJS conventions.

**`src/utils/string.ts` additions**

Three new string utilities required for name derivation:

- `toKebabCase()` — PascalCase/camelCase → kebab-case (e.g. `SupplierSearch` → `supplier-search`)
- `toCamelCase()` — PascalCase → camelCase (e.g. `Supplier` → `supplier`)
- `toPascalCase()` — normalises first character to uppercase

---

## [0.1.0] — MVP — 2026-07-03

The first complete release. A single `pw-gen new` command produces a fully-structured,
immediately runnable enterprise Playwright TypeScript framework.

### Generator

**`pw-gen new` command**

A CLI command that accepts project configuration via individual flags
(`--name`, `--org`, `--app`, `--envs`, `--default-env`, `--type`, `--output`)
or a JSON configuration file (`--config pw-gen.config.json`). All input is
validated by Zod before any files are written. Invalid configuration produces a
clear error message identifying the failing field.

**Two-phase generation**

Templates are rendered into memory (`StagedFile[]`) before any disk writes begin.
A template error cannot produce a partially-written output directory. Either all
files are written, or none are.

**Module system**

`ModuleRegistry` and `ModuleManifest` establish the composable module architecture.
The `core` module is always included. The registry is ready to accommodate future
optional modules (`auth`, `api`, `database`) without changing the generation pipeline.

### Generated Framework

Running `pw-gen new` produces a complete, standalone Playwright TypeScript project.
Generated frameworks have no runtime dependency on pw-gen. Every file belongs to the
team that generated it.

**Project files (13 total)**

- `playwright.config.ts` — environments, reporters, trace settings, browser projects
- `package.json` — all dependencies and per-environment npm scripts
- `tsconfig.json` — strict TypeScript, CommonJS output
- `.gitignore` — node_modules, test-results, auth state, .env files
- `.env.example` — credential template
- `.prettierrc.json` — code formatting configuration
- `README.md` — self-documenting enterprise README (see below)

**`BasePage` — enterprise helper set**

The abstract base class provides the complete range of helpers an automation
engineer needs from day one:

- `goto()` — navigation with logging
- `waitForElement()` — waits for element visibility with configurable timeout
- `waitForLoadingIndicator()` — waits for loading spinners or overlays to disappear
- `waitForNetworkIdle()` — waits for network idle state before asserting
- `isVisible()` — non-throwing boolean visibility check for conditional branching
- `expectHidden()` — assertion that an element is hidden or detached
- `expectToast()` — toast and notification message verification
- `scrollIntoView()` — scroll element into the viewport
- `takeScreenshot()` — screenshot with automatic attachment to test report
- `click()`, `fill()`, `selectOption()` — interaction helpers with logging

Every Page Object in the generated framework inherits these helpers by extending `BasePage`.

**`LoginPage` — enterprise authentication Page Object template**

A production-quality Page Object that demonstrates enterprise conventions:

- Private readonly locators with adaptation comments identifying where to modify for the target application
- `login(username, password)` — direct credential login
- `loginWithEnvCredentials()` — environment-driven authentication (reads from `ENV`)
- `expectOnLoginPage()` — asserts the login page has loaded
- `expectLoginSuccess()` — post-login state assertion (engineers implement for their application)
- `expectLoginError()` — error message assertion

**Typed fixture architecture**

`fixtures/test.ts` provides a typed, extensible fixture set built on Playwright's
`base.extend<AppFixtures>()`:

- `loginPage` — pre-instantiated `LoginPage` available in any test via parameter destructuring
- `_testLifecycle` — auto-fixture that logs test start, pass, and failure for every test
  without any changes to individual test files
- `AppFixtures` type — exported for adding new fixtures following the same pattern

**Login smoke test**

The generated `tests/smoke/login.smoke.spec.ts` demonstrates the complete framework stack:

- Passes out of the box against any reachable URL (verifies connectivity without requiring credentials)
- Tagged `@smoke` for selective test execution
- Demonstrates `test.step()` for structured test decomposition
- Uses the logger for structured output
- Attaches a screenshot on completion
- Includes a commented-out full login flow ready to uncomment once the application is configured

**Structured Winston logger**

- Padded level field for aligned log output
- Colorized output locally; plain text in CI for log parser compatibility
- Log level controlled via `LOG_LEVEL` environment variable
- Singleton pattern — import and use anywhere in the framework

**Self-documenting `README.md`**

Every generated framework includes a comprehensive README covering:

- Complete folder structure with explanations
- Page Object conventions and the extension pattern
- Test writing guide with imports and annotations
- Fixture usage and the `AppFixtures` extension pattern
- Logging levels reference
- Environment configuration guide
- CI integration reference

### Known Gaps (Resolved in v0.2)

The following known gaps exist in v0.1 and are approved for resolution in v0.2:

- `screenshot: "on"` and `video: "on"` — records for passing tests (should be failure-only)
- No ESLint — `no-floating-promises` rule not yet generated
- `testIdAttribute` not surfaced in generated config
- `isVisible()` JSDoc does not warn against assertion use
- Soft assertions (`expect.soft()`) not documented in generated README

See [PLAYWRIGHT_ALIGNMENT.md](PLAYWRIGHT_ALIGNMENT.md) for the full gap analysis and resolution schedule.

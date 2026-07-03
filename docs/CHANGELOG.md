# Changelog

All notable product capabilities delivered by pw-gen are documented here.

Format: product-focused capability descriptions per release.
For implementation decisions, see [DECISIONS.md](DECISIONS.md) and the [ADR index](adr/).

---

## [Unreleased]

Changes planned but not yet released. See [ROADMAP.md](ROADMAP.md) for v0.2 scope.

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

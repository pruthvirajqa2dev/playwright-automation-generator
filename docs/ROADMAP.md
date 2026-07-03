# Roadmap — Playwright Automation Generator

Product releases from MVP through the enterprise automation platform vision.

> **Status key:** ✅ Released · ⬜ Planned

---

## ✅ v0.1 — MVP

_Released: 2026-07-03_

> One command produces a complete, immediately runnable enterprise Playwright framework.

The foundation release. Proves the generation pipeline end-to-end and establishes
the engineering conventions that all future releases build on.

**Delivered:**

- `pw-gen new` CLI command — flag-based and JSON config file input
- Zod validation at the CLI boundary — invalid config rejected before any file writes
- Five-stage generation pipeline: validate → context → render → stage → write
- Two-phase atomicity: all templates render in memory before any disk writes begin
- Module system foundation: `ModuleRegistry` and `ModuleManifest` interface
- `core` module: 13 generated files — complete, standalone Playwright TypeScript project
- Enterprise `BasePage` — navigation, wait, assertion, screenshot, and scroll helpers
- `LoginPage` template — environment-driven credentials, business-oriented methods
- Typed fixture architecture — `loginPage` fixture + `_testLifecycle` auto-logger
- Login smoke test — passes out of the box; demonstrates full framework stack
- Structured Winston logger — colorized locally, plain text in CI
- Self-documenting generated `README.md`

---

## ⬜ v0.2 — Playwright Excellence

_Planned_

> Close every known gap between the generated framework and Playwright best practices.

All items from the Phase 2a column in [PLAYWRIGHT_ALIGNMENT.md](PLAYWRIGHT_ALIGNMENT.md).

**Planned:**

- `screenshot: "only-on-failure"` and `video: "retain-on-failure"` — stop recording for passing tests
- `testIdAttribute` surfaced in config — discoverable customisation point for `getByTestId()`
- Firefox and WebKit projects added as commented-out config blocks — opt-in multi-browser
- `fullyParallel` comment updated — explains the safe upgrade path via Auth Module
- `isVisible()` anti-pattern warning strengthened — explicit JSDoc; must not be used as an assertion
- ESLint configuration generated alongside the framework — `no-floating-promises` prevents silent assertion failures
- `expect.soft()` documented in generated README — demonstrated for dashboard/multi-element tests
- `retries` comment improved — explains the enterprise rationale for `1` vs Playwright's default `2`

---

## ⬜ v0.3 — Enterprise Core

_Planned_

> Expand the core module to cover the full enterprise testing foundation.

**Planned:**

- Multi-environment `playwright.config.ts` with named project variants (uat, staging, prod)
- `BasePage` extension: modal and overlay Page Object base class
- Environment variable validation on startup — fail fast on missing required variables
- Comprehensive `.env.example` with all variables documented and explained
- `pw-gen.config.json` generated alongside the framework — records generation parameters for future upgrade
- Accessibility smoke test template (axe-core integration, opt-in)

---

## ⬜ v0.4 — Authentication Module

_Planned_

> Deliver the `auth` module: session-based authentication using `storageState`.

The correct long-term authentication pattern, deferred from MVP to be implemented properly.
See [ADR-007](adr/ADR-007-authentication-storagstate-deferred.md) for the deferral rationale.

**Planned:**

- `auth` module manifest and templates
- `tests/auth.setup.ts` — dedicated setup test that authenticates once per worker
- `setup` project in `playwright.config.ts` with `dependencies: ['setup']` on test projects
- `playwright/.auth/user.json` — persisted browser state (gitignored)
- `mergeTests()` fixture composition — replaces `base.extend()` when combining core and auth fixtures
- Worker-scoped authenticated session fixture — tests share session, skipping UI login
- Multi-user persona support — admin, standard, read-only credential sets
- Session expiry detection and automatic re-authentication
- Upgrade path for v0.1/v0.2/v0.3 frameworks to adopt the auth module

---

## ⬜ v0.5 — Scaffolding Commands

_In Progress (Phase 1 delivered: 2026-07-03)_

> Add `pw-gen add` commands to scaffold individual artifacts into existing generated projects.

**Delivered (Phase 1):**

- ✅ `pw-gen add page <name>` — scaffold a new Page Object extending `BasePage`
- ✅ `pw-gen add test <name>` — scaffold a new test file with standard imports and structure
- ✅ Overwrite protection — existing files are never silently overwritten; `--force` opt-in
- ✅ `--output` flag — specify framework root; defaults to current directory with validation
- ✅ `ScaffoldContext` — lightweight context for scaffold templates (name, slug, camelName)
- ✅ `Scaffolder` service — reuses `TemplateRenderer` and `FileWriter` from the generation engine
- ✅ `TemplateRenderer.renderSingle()` — single-file render method for scaffold operations
- ✅ `src/modules/scaffold/templates/` — scaffold EJS templates following module template conventions

**Planned (Phase 2):**

- `pw-gen add fixture <name>` — scaffold a new typed fixture with `AppFixtures` extension
- `pw-gen add module <module-name>` — add an optional module to an existing generated project

---

## ⬜ v0.6 — Module Ecosystem

_Planned_

> Optional modules for API testing, database access, and custom reporting.

**Planned:**

- **`api` module:** `ApiClient` base class (Playwright `APIRequestContext` wrapper), typed response
  helpers, API fixture in the extended test object, API smoke test template
- **`database` module:** typed database client (configurable: MSSQL / PostgreSQL), test data
  factory pattern, auto-teardown fixture, data seeding smoke test
- **`reporting` module:** custom HTML report theme with organisation branding, test result
  trend tracking (JSON history), failure screenshot baseline comparison

---

## ⬜ v0.7 — Framework Intelligence

_Planned_

> Give the generator awareness of existing generated projects for upgrade and analysis.

**Planned:**

- `pw-gen upgrade` — diff current project files against current template output
- Selective file adoption — upgrade specific files without full regeneration
- Upgrade history tracking via per-file `generated-at` metadata
- Conflict detection for files modified after initial generation
- `pw-gen validate` — verify a generated project conforms to current framework conventions

---

## ⬜ v0.8 — Platform UI

_Planned_

> Web-based interface for teams that prefer GUI project creation.

**Planned:**

- Local web UI for `pw-gen new` — form-based project configuration
- Live preview of the directory structure that will be generated
- Module dependency visualisation — show which modules are required by selected modules
- Configuration export as `pw-gen.config.json`

---

## ⬜ v0.9 — Pipeline Providers

_Planned_

> Generate CI/CD pipeline configuration alongside the test framework.

**Planned:**

- **`azure-devops` provider:** multi-stage `azure-pipelines.yml`, variable group documentation
  template, artifact publishing (HTML report + `test-results.json`), PR validation gate
- **`github-actions` provider:** workflow YAML with matrix strategy, artifact publishing
- Pipeline provider selectable at generation time: `--pipeline azure-devops`
- Shard configuration for parallelised CI runs

---

## ⬜ v1.0 — Enterprise Automation Platform

_Planned_

> Production-ready platform. All core modules and providers stable. Complete documentation.

**Criteria for v1.0:**

- `core`, `auth`, `api`, and `database` modules all stable and documented
- At least one pipeline provider shipped and in active use
- `pw-gen upgrade` operational and tested against real generated projects
- All Playwright alignment items resolved — each gap is adopted, formally deferred, or documented as intentional divergence
- Generator codebase test coverage ≥ 90%
- Public documentation site live

---

## ⬜ v2.0 — AI Test Author

_Planned_

> AI-assisted test authoring built on the stable v1.0 platform.

> **Prerequisite:** v1.0 complete, framework conventions locked, templates stable, and documentation comprehensive.

AI augmentation requires a stable, well-documented foundation that an LLM can reason
about accurately. Premature AI features on an evolving framework produce inconsistent output.

**Planned:**

- Natural language → `test.step()` skeleton generation
- Screenshot → Page Object locator suggestion
- Test coverage gap analysis — identify pages and flows with no test coverage
- Generated test quality review — hallucination detection and correction suggestions
- Playwright trace → reproduction test (failed trace → runnable regression test)

---

## Deferred Items

Items not on the active roadmap, with documented rationale.

| Item                                  | Deferred To | Rationale                                                                        |
| ------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `storageState` authentication pattern | v0.4        | Requires Auth Module; partial implementation produces non-runnable scaffolding   |
| `mergeTests()` fixture composition    | v0.4        | Correct only when multiple modules contribute fixtures; premature with core-only |
| ESLint in generated framework         | v0.2        | Gap-analysis approved; deferred from MVP to maintain tight initial scope         |
| Azure DevOps pipeline generation      | v0.9        | Depends on stable framework script names, artifact paths, and env conventions    |
| `pw-gen upgrade` command              | v0.7        | Pipeline must be mature; upgrade design requires stable template conventions     |
| AI test authoring                     | v2.0        | Requires stable conventions and comprehensive docs before AI output is reliable  |

# Technical Decisions — Chronological Log

A concise record of significant technical decisions made during the development
of pw-gen. For full context and rationale, refer to the corresponding ADR.

---

## 2026-06-01 — Initial Architecture

- **EJS chosen as the template engine** over Handlebars and Mustache.
  EJS allows native JavaScript in templates, requires no custom helper
  registration, and is immediately readable by any JavaScript developer.
  → [ADR-001](adr/ADR-001-ejs-template-engine.md)

- **Generated frameworks are independent repositories** with no runtime
  dependency on pw-gen or any shared generator library. Each generated
  project owns all its code. Teams can modify any file freely.
  → [ADR-002](adr/ADR-002-independent-generated-repositories.md)

- **Module composition happens at generation time**, not at runtime. Optional
  capabilities (auth, API, database) contribute EJS templates that are rendered
  into the same output directory as the core module — producing a unified,
  flat codebase with no runtime plugin machinery.
  → [ADR-003](adr/ADR-003-module-composition-at-generation-time.md)

- **Zod validates all user input at the CLI boundary.** The Zod schema is the
  single source of truth for both the runtime validation rules and the TypeScript
  type. Invalid configurations are rejected before any file writes begin.
  → [ADR-005](adr/ADR-005-zod-validation-at-cli-boundary.md)

- **`TemplateContext` is the single typed contract between the engine and
  templates.** All logic, computed values, and derived fields live in
  `ContextBuilder`. Templates are thin: substitution and iteration only.
  → [ADR-006](adr/ADR-006-template-context-single-contract.md)

- **Two-phase generation: stage in memory, then write.** `TemplateRenderer`
  renders all templates into `StagedFile[]` objects before `FileWriter` touches
  the filesystem. A template error never produces a partially-written output
  directory.

- **Commander.js chosen for the CLI.** Mature, well-documented, minimal surface
  area. Supports both flag-based and config-file-based input in the same command
  definition.

- **`fs-extra` used for filesystem operations.** Drop-in replacement for Node's
  `fs` module with `ensureDir`, `writeFile`, and `copySync` making the
  FileWriter and build script simpler.

---

## 2026-06-15 — Framework Strategy

- **Azure DevOps integration intentionally deferred.** CI/CD pipeline generation
  will not be built until the generated framework foundation is stable. Pipeline
  templates must encode stable script names, artifact paths, and environment
  variable conventions — these must be locked first.
  → [ADR-004](adr/ADR-004-azure-devops-deferred.md)

- **AI-assisted test authoring deferred.** AI features require a stable, well-
  structured framework that AI tooling can reason about. The framework must
  demonstrate clear, consistent conventions before AI augmentation is meaningful.

- **Upgrade mechanism deferred.** A `pw-gen upgrade` command that diffs generated
  files against current templates is a future capability. The foundational
  generation pipeline must be mature before an upgrade path can be meaningfully
  designed.

- **Winston chosen as the logging library** for generated frameworks. Structured
  logging with configurable log levels, timestamp formatting, and CI-aware
  console suppression. Lightweight and stable.

- **`dotenv` chosen for environment management** in generated frameworks. Simple,
  universal, supports layered overrides (`src/config/.env` + `src/config/.env.{ENV}`).

---

## 2026-07-03 — Phase 1: Enterprise Core Foundation

- **`SamplePage` replaced with `LoginPage`.** The placeholder `SamplePage` that
  targeted `https://playwright.dev` was replaced with a production-quality
  `LoginPage` template that demonstrates enterprise Page Object practices:
  private readonly locators, business-oriented methods, environment-driven
  credentials, and explicit adaptation points for the target application.

- **`sample.spec.ts` replaced with `login.smoke.spec.ts`.** The sample test was
  replaced with a login smoke test that: runs out of the box (no application
  credentials required), demonstrates `test.step()` usage, logger integration,
  Page Object usage, test annotations, and a commented template showing the full
  login flow.

- **`BasePage` extended with production helpers.** Added: `waitForElement()`,
  `waitForLoadingIndicator()`, `waitForNetworkIdle()`, `isVisible()`,
  `expectHidden()`, `expectToast()`, `scrollIntoView()`. The base class now
  covers the full range of helpers a real automation engineer needs.

- **Typed fixture architecture introduced.** `fixtures/test.ts` now uses
  `base.extend<AppFixtures>()` to define a typed fixture set. The `loginPage`
  fixture is pre-instantiated for injection into any test. The `_testLifecycle`
  auto-fixture logs test start, pass, and failure for every test automatically.

- **Logger format improved.** Level field is padded for alignment. Local output
  is colorized; CI output is plain text for log parser compatibility. The
  `isCI` flag is derived once and reused.

- **Enterprise README template.** The generated `README.md` now covers the
  full framework: folder structure, Page Object conventions, test conventions,
  fixture usage, logging levels, environment configuration, and CI integration
  guidance. Every generated framework is self-documenting.

- **`npm run build` copies templates automatically.** The build script was
  updated to copy EJS templates from `src/` to `dist/` after `tsc`. Previously,
  this was a manual step that broke generation after a clean build.

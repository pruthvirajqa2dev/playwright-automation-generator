# Playwright Alignment

> This document is the authoritative record of where pw-gen agrees with, diverges from,
> or defers Playwright's official recommendations — and the engineering reasoning behind
> each decision.
>
> **Read this before making any template change.** Every divergence from Playwright's
> recommendations is intentional and documented here.

---

## How to Read This Document

Each decision falls into one of three categories:

- **Adopted** — The generated framework follows the Playwright recommendation.
  Adoption may be immediate (already in v0.1) or planned (approved for a named release).
- **Intentionally Different** — The generated framework diverges from Playwright's default
  or recommendation. The divergence is permanent unless the enterprise context changes.
  Every divergence requires a documented rationale.
- **Deferred** — The Playwright recommendation is correct and will be adopted in a future
  release. Not yet implemented because the prerequisite (a module or stable foundation)
  is not yet in place.

---

## Summary

| ID  | Topic                                     | Category                | Release | ADR                                                              |
| --- | ----------------------------------------- | ----------------------- | ------- | ---------------------------------------------------------------- |
| P1  | `storageState` authentication             | Deferred                | v0.4    | [ADR-007](adr/ADR-007-authentication-storagstate-deferred.md)    |
| P2  | `screenshot` and `video` settings         | Adopt in v0.2           | v0.2    | —                                                                |
| P3  | `isVisible()` anti-pattern warning        | Adopt in v0.2           | v0.2    | —                                                                |
| P4  | `fullyParallel: false` default            | Intentionally Different | —       | [ADR-008](adr/ADR-008-fullyparallel-false-enterprise-default.md) |
| P5  | `TestInfo` in `BasePage` constructor      | Intentionally Different | —       | [ADR-009](adr/ADR-009-testinfo-in-basepage-constructor.md)       |
| P6  | No ESLint in generated framework          | Adopt in v0.2           | v0.2    | —                                                                |
| P7  | Chromium-only configuration               | Intentionally Different | —       | [ADR-010](adr/ADR-010-single-browser-default.md)                 |
| P8  | No `testIdAttribute` configured           | Adopt in v0.2           | v0.2    | —                                                                |
| P9  | No soft assertions demonstrated           | Adopt in v0.2           | v0.2    | —                                                                |
| P10 | `base.extend()` instead of `mergeTests()` | Deferred                | v0.4    | —                                                                |
| P11 | Action-level logging in `BasePage`        | Intentionally Different | —       | [ADR-011](adr/ADR-011-action-level-logging-retained.md)          |
| P12 | `retries: 1` on CI vs Playwright's `2`    | Intentionally Different | —       | —                                                                |

---

## Fully Adopted

The following Playwright recommendations are adopted without modification in v0.1.

| Practice                 | How it is implemented                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| Trace Viewer             | `trace: "on-first-retry"` — correct default in generated `playwright.config.ts`   |
| `test.step()`            | Generated smoke test demonstrates `test.step()` for structured test decomposition |
| Page Object Model        | Generated frameworks use POM exclusively — no procedural test code                |
| Async/await              | All generated test and Page Object code is correctly async/await throughout       |
| Locator API              | Generated Page Objects use `page.locator()` — no `$`, `$$`, or `ElementHandle`    |
| TypeScript               | All generated code is TypeScript with `strict: true`                              |
| Environment separation   | Test configuration is environment-driven via `ENV` wrapper — no hardcoded values  |
| Fixture-based test setup | `test.ts` uses Playwright's `base.extend()` for fixture composition               |

---

## Intentionally Different

These divergences are **permanent**. They reflect deliberate decisions that Playwright's
default is correct for general use but sub-optimal for enterprise automation contexts.

A divergence documented here requires a documented argument to change.

---

### P4 · `fullyParallel: false` default

**Playwright default:** `fullyParallel: true`
**Generated framework:** `fullyParallel: false`

**Why this is the right default for enterprise teams:**

Enterprise UI automation suites run against shared environments with shared test data.
Without `storageState` and without isolated test data per worker, fully parallel execution
creates order-dependent failures and shared-resource contention that is difficult to diagnose.

A team running their first automation suite does not yet have the isolation contracts in
place to safely enable full parallelism. `fullyParallel: false` is the safer starting
point. It protects new teams from a class of non-deterministic failures that undermine
confidence in the automation suite before it has been established.

When the Auth Module (v0.4) delivers `storageState` and teams have implemented isolated
test data strategies, the generated config comment guides them through the upgrade to
`fullyParallel: true`.

→ [ADR-008](adr/ADR-008-fullyparallel-false-enterprise-default.md)

---

### P5 · `TestInfo` in `BasePage` constructor

**Playwright recommendation:** `constructor(page: Page)`
**Generated framework:** `constructor(page: Page, testInfo: TestInfo)`

**Why `TestInfo` belongs in the constructor:**

`testInfo.outputDir` provides the output path for screenshots and other artifacts attached
to the test report. `testInfo.title` enables log messages to include the test name for
immediate correlation in CI output.

The alternative — calling `test.info()` inside `BasePage` methods — couples the base class
to a global function and makes the dependency invisible to callers. Explicit constructor
injection makes the dependency transparent, documents the requirement at the call site,
and enables isolated unit testing of Page Objects with a mock `testInfo` object.

The overhead (one additional parameter passed through every fixture) is accepted as the
correct trade-off for traceability and testability.

→ [ADR-009](adr/ADR-009-testinfo-in-basepage-constructor.md)

---

### P7 · Chromium-only configuration

**Playwright recommendation:** Test across all browsers.
**Generated framework:** Chromium only; Firefox and WebKit as commented-out blocks (from v0.2).

**Why Chromium-primary is the right enterprise default:**

Most enterprise applications target a corporate standard browser, typically Chromium/Chrome.
For internal enterprise applications with a known, controlled browser population, running all
three browser engines in every CI build multiplies execution time by 3x with diminishing
additional coverage.

Enterprise teams typically run cross-browser testing in separate scheduled pipelines, not
in every PR build. Generating a three-browser configuration by default would immediately
prompt teams to comment out browsers to reduce CI time — a worse starting point than
Chromium-only.

Firefox and WebKit projects are included as commented-out blocks (v0.2) so teams can enable
cross-browser testing for their context with a single line change.

→ [ADR-010](adr/ADR-010-single-browser-default.md)

---

### P11 · Action-level logging in `BasePage`

**Playwright approach:** Trace Viewer captures all actions with screenshots and DOM snapshots.
**Generated framework:** Winston logger also logs every UI interaction to stdout.

**Why both exist:**

The Trace Viewer is an excellent debugging tool, but it requires a separate application to open,
must be downloaded as a CI artifact, and is not visible in pipeline stdout. For enterprise teams
running tests in Azure DevOps or GitHub Actions, the Winston log in pipeline stdout is the first
— and often only — artifact reviewed when a build fails before anyone downloads trace files.

The overlap between action-level logging and the Trace Viewer is an accepted redundancy. Teams
that find the logging too verbose can reduce the log level via `LOG_LEVEL=warn` in their
environment configuration.

→ [ADR-011](adr/ADR-011-action-level-logging-retained.md)

---

### P12 · `retries: 1` on CI

**Playwright default:** `retries: isCI ? 2 : 0`
**Generated framework:** `retries: isCI ? 1 : 0`

**Why one retry is better than two for enterprise:**

With 2 retries, a genuinely failing test runs 3 times before the build reports failure.
For a broken build with 10 failing tests, this triples the time before the team learns
their PR is blocked. The 3x execution cost is paid on every broken build.

Enterprise teams running against dedicated staging environments experience lower ambient
flake rates than the general Playwright audience (public CI runners, shared test databases,
high-contributor open-source projects). One retry provides sufficient protection against
transient network anomalies without masking real failures through repeated execution.

Teams running in genuinely unstable environments should update `retries: isCI ? 2 : 0`
in their generated `playwright.config.ts`.

---

## Deferred

These Playwright recommendations are correct and approved for adoption in a future release.
They are not yet implemented because the prerequisite module or stable foundation is not yet
in place. Partial implementation would produce non-runnable scaffolding.

---

### P1 · `storageState` authentication (defer to v0.4)

**Playwright recommendation:** Authenticate once in a setup project, persist session to
`playwright/.auth/user.json`, reuse via `storageState` across all test projects.

**Current state (v0.1):** `LoginPage.loginWithEnvCredentials()` authenticates via UI
in every test. Functional but slower than session reuse.

**Why deferred to v0.4 (Auth Module):**

Implementing `storageState` correctly requires: a dedicated `tests/auth.setup.ts` file,
a `setup` project in `playwright.config.ts` with `dependencies: ['setup']` on all test
projects, a `playwright/.auth/` directory (gitignored), and fixture composition changes to
support session reuse per worker.

This is a module-boundary concern. Adding a partial `storageState` skeleton to the core
template would produce scaffolding that cannot run until manually configured — exactly
the problem pw-gen exists to solve. The Auth Module (v0.4) will deliver the complete,
runnable pattern correctly as a cohesive module.

`loginWithEnvCredentials()` is not a placeholder — it is a functional starting point that
authenticates correctly. The Auth Module upgrades it to the optimal pattern.

→ [ADR-007](adr/ADR-007-authentication-storagstate-deferred.md)

---

### P2 · `screenshot` and `video` settings (adopt in v0.2)

**Playwright recommendation:** `screenshot: "only-on-failure"`, `video: "retain-on-failure"`
**Current state (v0.1):** `screenshot: "on"`, `video: "on"` (all tests, including passing)

**Why changed in v0.2:**

Recording screenshots and video for every test, including passing ones, produces unnecessary
CI artifacts and increases storage and transfer costs. Playwright's recommendations are
unambiguously correct here — there is no enterprise counter-argument for always-on recording.
No ADR required.

---

### P3 · `isVisible()` anti-pattern warning (adopt in v0.2)

**Playwright recommendation:** Do not use `isVisible()` as an assertion.
**Current state (v0.1):** `BasePage.isVisible()` is provided without an explicit warning.

**Why changed in v0.2:**

`locator.isVisible()` is instant with no auto-waiting. Using it as an assertion produces
tests that pass or fail based on timing rather than application state — one of the most
common sources of flaky Playwright tests. An explicit, prominent JSDoc warning will be
added. The method itself is retained for legitimate conditional branching use cases
(checking for an optional banner after a stable page load).

---

### P6 · No ESLint in generated framework (adopt in v0.2)

**Playwright recommendation:** Use `@typescript-eslint/no-floating-promises` to catch
missing `await` before Playwright API calls.

**Current state (v0.1):** No ESLint configuration generated.

**Why this is critical:**

A missing `await` before `expect().toBeVisible()` produces a test that silently passes
while the assertion is never evaluated — one of the most insidious sources of false-positive
results in Playwright. The rule catches this at author time with zero runtime cost.

**Why added in v0.2:**

ESLint + `no-floating-promises` will be added to the core module as a standard part of
the generated framework. The configuration will be added to `eslint.config.mjs` and the
corresponding devDependencies and `npm run lint` script will be added to `package.json`.

---

### P8 · No `testIdAttribute` configured (adopt in v0.2)

**Playwright recommendation:** Configure `testIdAttribute` if using `getByTestId()`.
**Current state (v0.1):** Not configured. Defaults to Playwright's `data-testid`.

**Why changed in v0.2:**

Enterprise applications commonly use `data-qa`, `data-test`, `data-cy`, or
`data-automation-id`. Teams discover the missing configuration when they first try
`getByTestId()` and get unexpected results. Surfacing `testIdAttribute` in the generated
config — defaulting to `data-testid` with an explanatory comment — costs nothing and
eliminates a common first-hour friction point.

---

### P9 · Soft assertions not demonstrated (adopt in v0.2)

**Playwright recommendation:** `expect.soft()` for non-blocking multi-element assertions.
**Current state (v0.1):** Not mentioned in the generated README or test templates.

**Why added in v0.2:**

Soft assertions are particularly valuable for enterprise dashboard tests where a single
test verifies multiple independent page elements. A failure in one element should not
prevent verification of the others. `expect.soft()` is a standard Playwright feature
that the generated README should document and demonstrate.

---

### P10 · `base.extend()` instead of `mergeTests()` (defer to v0.4)

**Playwright recommendation:** Use `mergeTests()` when composing fixtures from multiple
independent fixture modules.

**Current state (v0.1):** `fixtures/test.ts` uses `base.extend<AppFixtures>()` directly.

**Why deferred:**

`mergeTests()` is the correct API when combining fixture sets from _separate_ modules —
for example, combining the `core` module's fixtures with the `auth` module's fixtures.
With only the core module, `base.extend()` is correct. Introducing `mergeTests()` before
a second module exists adds indirection without benefit. When the Auth Module (v0.4)
contributes its own fixture set, the fixture composition will be redesigned using
`mergeTests()` as the idiomatic Playwright approach.

---

## Adoption Schedule

| Release | Items adopted                                                        |
| ------- | -------------------------------------------------------------------- |
| v0.1    | Trace Viewer, POM, async/await, Locator API, TypeScript, ENV wrapper |
| v0.2    | P2, P3, P6, P7 (commented browsers), P8, P9                          |
| v0.4    | P1, P10                                                              |
| —       | P4, P5, P11, P12 — intentionally different, not subject to adoption  |

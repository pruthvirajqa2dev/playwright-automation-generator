# Playwright Alignment — Decision Register

> This document records every identified gap between the generated framework and the
> official Playwright documentation or best practices. For each gap, it states whether
> the framework **adopts** the recommendation, **intentionally diverges** from it, or
> **defers** it to a future milestone, and explains why.
>
> This is the authoritative reference before making any template changes in Phase 2.

---

## Summary Table

| ID                                            | Gap                                              | Decision                             | Phase       | ADR                                                              |
| --------------------------------------------- | ------------------------------------------------ | ------------------------------------ | ----------- | ---------------------------------------------------------------- |
| [G1](#g1--authentication-storagstate-absent)  | No `storageState` authentication pattern         | **Defer** — Auth Module              | Milestone 2 | [ADR-007](adr/ADR-007-authentication-storagstate-deferred.md)    |
| [G2](#g2--video-and-screenshot-settings)      | `video: "on"` + `screenshot: "on"`               | **Adopt** Playwright recommendation  | Phase 2a    | —                                                                |
| [G3](#g3--isvisible-anti-pattern-warning)     | `isVisible()` missing assertion warning          | **Adopt** — strengthen JSDoc warning | Phase 2a    | —                                                                |
| [G4](#g4--fullyparallel-false-default)        | `fullyParallel: false` default                   | **Intentional divergence**           | Phase 2a    | [ADR-008](adr/ADR-008-fullyparallel-false-enterprise-default.md) |
| [G5](#g5--testinfo-in-basepage-constructor)   | `TestInfo` in `BasePage` constructor             | **Intentional divergence**           | —           | [ADR-009](adr/ADR-009-testinfo-in-basepage-constructor.md)       |
| [G6](#g6--no-eslint)                          | No ESLint / floating-promises rule               | **Adopt**                            | Phase 2a    | —                                                                |
| [G7](#g7--chromium-only)                      | Chromium only in config                          | **Intentional divergence**           | Phase 2a    | [ADR-010](adr/ADR-010-single-browser-default.md)                 |
| [G8](#g8--no-testidattribute)                 | No `testIdAttribute` configured                  | **Adopt**                            | Phase 2a    | —                                                                |
| [G9](#g9--no-soft-assertions)                 | No soft assertions demonstrated                  | **Adopt**                            | Phase 2a    | —                                                                |
| [G10](#g10--mergetests-not-used)              | `base.extend()` instead of `mergeTests()`        | **Defer** — premature                | Milestone 2 | —                                                                |
| [G11](#g11--action-level-logging-in-basepage) | Logger logs every action (overlaps Trace Viewer) | **Intentional divergence**           | —           | [ADR-011](adr/ADR-011-action-level-logging-retained.md)          |
| [G12](#g12--retries-1-vs-2-on-ci)             | `retries: 1` on CI vs. Playwright default `2`    | **Intentional divergence**           | Phase 2a    | —                                                                |

---

## Detailed Decisions

---

### G1 · Authentication: `storageState` absent

**Gap:** The generated framework authenticates via UI login in every test
(`loginWithEnvCredentials()`). Playwright's canonical pattern is to authenticate
once in a setup project, persist the browser state to `playwright/.auth/user.json`,
and reuse it across all tests via `storageState`.

**Decision: DEFER — Auth Module (Milestone 2)**

`storageState` is the correct long-term pattern. However, implementing it correctly
requires:

- `tests/auth.setup.ts` — a dedicated setup test file
- A `setup` project in `playwright.config.ts` with `dependencies: ['setup']` on
  test projects
- `playwright/.auth/` gitignored directory
- Optionally: worker-scoped fixtures for parallel multi-user scenarios

This is a module-boundary concern, not a config-template patch. Adding a partial
`storageState` skeleton to the core template would produce scaffolding that cannot
run until the team configures it — exactly the problem the LoginPage template
already solves. The Auth Module (Milestone 2) will deliver the complete pattern
properly.

**Impact on Phase 2a:** None. `LoginPage.loginWithEnvCredentials()` remains the
correct starting point.

→ [ADR-007](adr/ADR-007-authentication-storagstate-deferred.md)

---

### G2 · `video` and `screenshot` settings

**Gap:** `video: "on"` and `screenshot: "on"` record artifacts for every test,
including passing ones. Playwright recommends `"retain-on-failure"` and
`"only-on-failure"` respectively.

**Decision: ADOPT**

No counter-argument exists. Recording video for every test is explicitly described
in the Playwright docs as performance-heavy. The trace viewer (`"on-first-retry"`,
already correct) provides a superior debugging experience for failures, making
always-on video redundant.

**Phase 2a changes:**

- `screenshot: "on"` → `screenshot: "only-on-failure"`
- `video: "on"` → `video: "retain-on-failure"`

---

### G3 · `isVisible()` — missing anti-pattern warning

**Gap:** `BasePage.isVisible()` returns `locator.isVisible()` (instant, no
auto-waiting). Playwright's best practices page explicitly warns against using this
as an assertion.

**Decision: ADOPT — strengthen the JSDoc warning**

The method is kept — it has legitimate uses for conditional branching when element
state is already known to be stable (e.g. checking for an optional banner after
a page has fully loaded). The fix is to add an explicit, unambiguous warning in
the JSDoc that this method **must not be used as an assertion**.

**Phase 2a changes:** Update `BasePage.isVisible()` JSDoc.

---

### G4 · `fullyParallel: false` default

**Gap:** Playwright's default configuration template uses `fullyParallel: true`.
The generated framework defaults to `false`.

**Decision: INTENTIONAL DIVERGENCE — keep `false`, improve comment**

See [ADR-008](adr/ADR-008-fullyparallel-false-enterprise-default.md) for full
reasoning. Summary: enterprise UI automation suites against shared environments
with shared test data require explicit isolation contracts before parallel
execution is safe. `fullyParallel: false` is the safe default for teams without
`storageState` and without isolated test data. When those foundations are in place
(Auth Module), the comment should guide teams to switch.

**Phase 2a changes:** Revise the config comment to explain the tradeoff and
direct teams to the Auth Module documentation for the parallel-safe upgrade path.

→ [ADR-008](adr/ADR-008-fullyparallel-false-enterprise-default.md)

---

### G5 · `TestInfo` in `BasePage` constructor

**Gap:** Official Playwright POM examples use `constructor(page: Page)`. The
generated `BasePage` takes `(page: Page, testInfo: TestInfo)`.

**Decision: INTENTIONAL DIVERGENCE — keep `TestInfo` in constructor**

See [ADR-009](adr/ADR-009-testinfo-in-basepage-constructor.md). Summary: the
explicit constructor parameter provides screenshot attachment and output path
access in every Page Object without relying on global state. The overhead of
passing `testInfo` is a deliberate trade-off for traceability and isolation.

**No Phase 2a changes.**

→ [ADR-009](adr/ADR-009-testinfo-in-basepage-constructor.md)

---

### G6 · No ESLint

**Gap:** Playwright explicitly recommends `@typescript-eslint/no-floating-promises`
to catch missing `await` before async Playwright calls.

**Decision: ADOPT**

A missing `await` before `locator.click()` or `expect().toBeVisible()` produces
tests that appear to pass while actually skipping the assertion entirely — one of
the most insidious sources of false-positive test results in Playwright. The rule
catches this at author time with no runtime cost.

**Phase 2a changes:**

- Add `eslint.config.mjs` to the core module templates
- Add `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
  to generated `package.json` devDependencies
- Add `npm run lint` script to generated `package.json`

---

### G7 · Chromium only

**Gap:** Playwright best practices recommend testing across all browsers.
The generated config only includes a Chromium project.

**Decision: INTENTIONAL DIVERGENCE — Chromium primary, multi-browser opt-in**

See [ADR-010](adr/ADR-010-single-browser-default.md). Summary: most enterprise
teams have a primary browser certification target (typically Chromium/Chrome) and
run cross-browser testing in separate scheduled pipelines, not in every PR build.
Running all three browser engines on every CI run multiplies execution time by 3x
with diminishing returns for internal enterprise applications.

**Phase 2a changes:** Add commented-out Firefox and WebKit projects in the config
template so teams can enable them with a single line uncomment.

→ [ADR-010](adr/ADR-010-single-browser-default.md)

---

### G8 · No `testIdAttribute` configuration

**Gap:** Playwright's `getByTestId()` defaults to `data-testid`. Enterprise
applications commonly use `data-qa`, `data-test`, `data-cy`, or
`data-automation-id`.

**Decision: ADOPT**

Exposing `testIdAttribute` in the generated config costs nothing and prevents
teams from discovering the missing configuration when they first try `getByTestId()`.
Default remains `data-testid` (Playwright default), with a comment explaining
the customisation point.

**Phase 2a changes:** Add `testIdAttribute` to `use: {}` in the config template.

---

### G9 · No soft assertions demonstrated

**Gap:** Playwright documents `expect.soft()` as a productivity feature for
non-blocking multi-element assertions. The generated framework doesn't mention or
demonstrate it.

**Decision: ADOPT — document and demonstrate in README**

Soft assertions are particularly valuable in enterprise dashboard tests where a
single test verifies multiple independent page elements. A failure in one element
shouldn't prevent verification of the others.

**Phase 2a changes:** Add `expect.soft()` guidance to the generated `README.md`
template and mention it in the smoke test comments.

---

### G10 · `base.extend()` instead of `mergeTests()`

**Gap:** When composing fixtures from multiple modules, `mergeTests()` is the
idiomatic Playwright approach. The current `fixtures/test.ts` uses `base.extend()`
directly.

**Decision: DEFER — not yet relevant**

`mergeTests()` is appropriate when combining fixture sets from _separate_ modules.
With only the core module, `base.extend()` is the correct API. Introducing
`mergeTests()` prematurely adds complexity without benefit. When the Auth Module
contributes its own fixture set, the fixture composition pattern will be redesigned
to use `mergeTests()`.

**No Phase 2a changes.**

---

### G11 · Action-level logging in `BasePage`

**Gap:** `BasePage` logs every UI interaction (click, fill, navigate). Playwright's
Trace Viewer already captures these interactions natively with screenshots, DOM
snapshots, and timing.

**Decision: INTENTIONAL DIVERGENCE — action-level logging retained**

See [ADR-011](adr/ADR-011-action-level-logging-retained.md). Summary: the Winston
log in CI pipeline stdout is immediately visible without opening a separate tool
or downloading trace files. For enterprise teams without trace viewer access in
their CI dashboards, the log provides the only immediate record of what the test
did. The overlap with the trace viewer is accepted as a deliberate redundancy.

**No Phase 2a changes.**

→ [ADR-011](adr/ADR-011-action-level-logging-retained.md)

---

### G12 · `retries: 1` on CI vs. Playwright default `2`

**Gap:** The official Playwright configuration template uses `retries: isCI ? 2 : 0`.
The generated framework uses `retries: isCI ? 1 : 0`.

**Decision: INTENTIONAL DIVERGENCE — keep `1`**

With 2 retries, a genuinely failing test runs 3 times before being reported,
tripling CI time for broken builds. Enterprise teams with stable test environments
and low flake rates prefer to surface real failures quickly. One retry provides
protection against transient network issues or timing anomalies without masking
structural test failures.

The Playwright default of 2 assumes a higher ambient flake rate (e.g. public
CI runners, shared test databases). Enterprise teams running against dedicated
staging environments typically experience lower flake rates and therefore need
fewer safety nets.

**No Phase 2a changes** — `retries: isCI ? 1 : 0` is intentional and correct.

---

## Phase 2a Implementation Scope

Changes approved for implementation in the next milestone, in execution order:

| Order | Change                                   | Targets                                                        |
| ----- | ---------------------------------------- | -------------------------------------------------------------- |
| 1     | `screenshot` + `video` settings (G2)     | `playwright.config.ts.ejs`                                     |
| 2     | `retries` comment (G12)                  | `playwright.config.ts.ejs`                                     |
| 3     | `testIdAttribute` (G8)                   | `playwright.config.ts.ejs`                                     |
| 4     | Firefox + WebKit commented projects (G7) | `playwright.config.ts.ejs`                                     |
| 5     | `fullyParallel` comment update (G4)      | `playwright.config.ts.ejs`                                     |
| 6     | `isVisible()` warning (G3)               | `BasePage.ts.ejs`                                              |
| 7     | ESLint config + deps (G6)                | new `eslint.config.mjs.ejs`, `package.json.ejs`, `manifest.ts` |
| 8     | Soft assertions (G9)                     | `README.md.ejs`                                                |

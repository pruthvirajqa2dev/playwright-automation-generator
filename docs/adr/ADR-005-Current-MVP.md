# ADR-005 — MVP Scope: What the First Release Includes and Excludes

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Context

Building a code generator with ambitions toward an enterprise automation platform
requires a discipline of ruthless scope control for the first release. The risk is
not under-building — it is building the wrong things in the wrong order.

The MVP must answer one question convincingly: **Can this generator produce a
framework that a real automation engineer would actually use?**

Everything else is future work.

---

## Decision

The v0.1 MVP scope is:

**Included:**

- A single CLI command: `pw-gen new`
- Flag-based input and JSON config file input
- One always-included module: `core`
- A complete Playwright TypeScript project generated from the `core` module (13 files)
- Enterprise-quality generated code: real `BasePage`, real `LoginPage`, real smoke test
- The complete generation pipeline: validate → context → render → stage → write
- The module system foundation: `ModuleRegistry` + `ModuleManifest` interface

**Explicitly excluded from MVP:**

- Optional modules (auth, API, database) — not yet
- Azure DevOps or GitHub Actions pipeline generation — not yet
- `pw-gen upgrade` command — not yet
- `pw-gen add` scaffolding commands — not yet
- Web UI — not yet
- AI test authoring — not yet
- `storageState` authentication pattern — deferred to Auth Module
- ESLint configuration in generated frameworks — deferred to v0.2
- Multi-browser configuration — deferred to v0.2

---

## Rationale

### Why "One Command, One Framework, One Test Passing" Is Enough for v0.1

The MVP hypothesis is: **the generation pipeline works and produces usable output.**

Proving this hypothesis requires:

1. The CLI parses user input correctly
2. The context is built correctly from that input
3. Templates render into valid TypeScript and configuration files
4. The generated framework compiles with zero errors
5. The generated smoke test passes against a real URL

Every additional feature added to the MVP delays this validation and increases the
scope of each potential failure. Proving the pipeline first, with one module and
one command, keeps the scope tight and the success criterion clear.

### Why the Core Module Must Produce Enterprise-Quality Code

The temptation in an MVP is to generate placeholder code — `SamplePage`, `sample.spec.ts`,
and a `HelloWorld` test that navigates to `https://playwright.dev`. This approach
proves the pipeline but produces output that no real engineer would use.

The MVP code quality bar is deliberately high:

- `BasePage` with a real enterprise helper set (not just `goto`)
- `LoginPage` that demonstrates production Page Object patterns (not `SamplePage`)
- A smoke test that demonstrates the full framework stack (not a single `page.goto`)
- A README that an engineer joining the project could actually use

The reason: pw-gen's value proposition is not "generates files" — it is "generates
files you would actually want to start from." If the v0.1 output is placeholder code,
the claim is unsubstantiated.

### Why Optional Modules Are Deferred

Optional modules (auth, API, database) require the module system to work correctly —
specifically `ModuleRegistry.resolve()` with dependency checking, and module template
composition. These can be built after the pipeline is proven with the core module alone.

Additionally, each optional module has prerequisites:

- **Auth module** requires a stable `storageState` pattern — which requires a stable
  `playwright.config.ts` structure — which requires the core module to be settled first.
- **API module** requires a stable `ApiClient` design — which benefits from seeing how
  `BasePage` is used in practice.
- **Database module** requires decisions about supported databases — premature before
  the framework is used by real teams.

Sequencing is: prove the pipeline → stabilise the core → add modules.

### Why Pipeline Generation Is Deferred

CI/CD pipeline templates (Azure DevOps, GitHub Actions) must encode specific script
names, artifact paths, and environment variable conventions. These must be locked in
the generated framework before pipeline templates can reference them reliably.

Building pipeline templates before the framework conventions are stable would require
constant rework. The deferral is correct sequencing, not a deprioritisation.

### Why `storageState` Is Deferred Out of MVP

`storageState` is the correct long-term authentication pattern. But implementing it
correctly requires: a setup project, a `playwright/.auth/` directory (gitignored),
fixture composition changes, and a `loginPage` that supports both UI login and session
reuse.

Adding a non-functional `storageState` skeleton to the core template would produce
scaffolding that cannot run until manually configured — exactly the problem pw-gen
exists to solve. The Auth Module (v0.4) will deliver the complete, runnable pattern.
Until then, `loginWithEnvCredentials()` is a functional, testable alternative.

---

## MVP Success Criteria

The MVP is complete when:

1. `pw-gen new --name "FMS" --org "SIMS" --app "FMS" --output ./playwright-fms` runs without errors
2. The generated framework compiles with `tsc --noEmit` (zero errors)
3. The generated smoke test passes against `https://playwright.dev` with `npx playwright test`
4. The generated README is accurate and complete
5. The framework is the starting point a real automation engineer would want

All five criteria were met on **2026-07-03**.

---

## Consequences

**Positive:**

- The pipeline is proven before module complexity is added
- The core module generates genuinely usable code — the MVP delivers real value
- Optional module work begins on a stable, tested foundation

**Negative:**

- Teams who want auth or API capabilities immediately must wait for v0.4/v0.6
- The generated framework has known gaps (no ESLint, UI-login on every test) that
  are addressed in subsequent releases

---

## Future Considerations

- Each subsequent release should have an equally explicit scope decision with clear
  in/out criteria before implementation begins.
- The MVP scope decision should be revisited at v0.5 to assess whether the phasing
  was correct and whether any assumptions proved wrong.

---

## Related ADRs

- [ADR-004](ADR-004-azure-devops-deferred.md) — Azure DevOps integration deferred
- [ADR-007](ADR-007-authentication-storagstate-deferred.md) — `storageState` deferred to Auth Module
- [ADR-004-Playwright-First.md](ADR-004-Playwright-First.md) — Playwright as the foundation

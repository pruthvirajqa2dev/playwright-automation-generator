# ADR-004 — Playwright as the Foundation

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Context

pw-gen generates enterprise test automation frameworks. The choice of underlying
test framework is the most consequential decision the generator makes — it is
baked into every template, every generated Page Object, every generated fixture,
and every generated configuration file.

The generated framework must serve enterprise teams running UI, API, and eventually
integration tests against complex applications over multi-year project lifespans.

---

## Decision

pw-gen generates **Playwright TypeScript** frameworks exclusively. All templates,
conventions, helpers, and module designs are built around Playwright's API and
philosophy.

The generator does not support multiple test frameworks. It is not framework-agnostic.
It is intentionally, deeply Playwright-native.

---

## Alternatives Considered

### Cypress

Cypress is a widely-adopted UI automation framework with strong developer experience,
a component testing capability, and a large ecosystem.

**Why not chosen:**

1. **Architecture.** Cypress runs tests inside the browser in a JavaScript context.
   This architecture imposes fundamental limitations: no native multi-tab support,
   no network interception at the browser level, no cross-browser parallelism within
   a single run, and limitations on accessing Node.js APIs directly from tests.

2. **TypeScript support.** Cypress supports TypeScript but through a compilation step
   that adds complexity. Playwright's TypeScript support is native and requires no
   additional configuration.

3. **Enterprise scale.** Cypress's sharding and parallelisation story for large enterprise
   suites adds operational complexity. Playwright's built-in sharding and parallelism
   model scales cleanly.

4. **API testing.** Playwright's `APIRequestContext` integrates API and UI testing
   natively. Cypress requires a separate `cy.request()` approach that does not share
   the browser session context.

5. **Velocity.** Playwright's development velocity (new features, browser compatibility,
   tracing capabilities) has consistently outpaced Cypress in recent years.

### Selenium / WebDriver

Selenium is the industry-established standard with the widest browser compatibility
matrix and the most documentation.

**Why not chosen:**

1. **Async model.** Selenium's implicit wait and synchronous-looking API produces
   fundamentally different code than Playwright's async/await with auto-waiting
   locators. Generating idiomatic Selenium TypeScript code requires significantly
   more boilerplate.

2. **Auto-waiting.** Playwright's locators auto-wait for elements to be actionable.
   Selenium requires explicit waits, which produce fragile tests without careful
   engineering discipline.

3. **Modern tooling.** Playwright provides built-in Trace Viewer, test reporter,
   code generation, and testing utilities. Selenium relies on third-party tools for
   equivalent functionality.

4. **Enterprise adoption direction.** The industry migration from Selenium to Playwright
   is well underway. Building on Playwright positions generated frameworks for the
   future, not the past.

### Framework-Agnostic Generator

pw-gen could be designed to support multiple test frameworks, generating Playwright
or Cypress frameworks based on a user flag.

**Why not chosen:**

1. **Depth vs. breadth.** Deep, opinionated Playwright expertise is more valuable
   than shallow support for multiple frameworks. Every engineering decision in pw-gen
   is made with full knowledge of Playwright's design philosophy. Splitting focus
   across frameworks would dilute this.

2. **Template proliferation.** Supporting two frameworks means maintaining two
   versions of every template. Template quality would degrade as complexity increases.

3. **Convention inconsistency.** Each framework has different idioms, different
   recommended patterns, different fixture systems. A "framework-agnostic" generator
   would produce generic code that is idiomatic in neither.

---

## Rationale

### Playwright Is Purpose-Built for Enterprise Automation

Playwright was designed from the ground up for reliable end-to-end testing at scale:

- **Auto-waiting locators** eliminate the largest source of flaky tests
- **Async/await throughout** produces natural, readable test code
- **Multiple contexts and pages** in a single test enable complex enterprise scenarios
- **Network interception** enables API mocking without proxy configuration
- **Trace Viewer** provides a complete record of test execution without log parsing
- **TypeScript-first** — all Playwright APIs are typed natively

### The Generated Framework Teaches Playwright

By generating deeply idiomatic Playwright code, pw-gen teaches the Playwright API
to engineers who read and modify the generated framework. Every generated Page Object
demonstrates locator strategy. Every generated fixture demonstrates test composition.
The generated framework is a Playwright tutorial that is immediately applicable to
the team's real application.

This is only possible because pw-gen is committed to Playwright — not a generic
"automation framework" that could be any technology.

### Playwright Alignment as a Living Practice

The [PLAYWRIGHT_ALIGNMENT.md](../PLAYWRIGHT_ALIGNMENT.md) document records every
point where the generated framework diverges from Playwright's recommendations and
why. This document exists because pw-gen takes the Playwright-first commitment
seriously: every divergence requires a documented justification. The default is
alignment, not convenience.

---

## Consequences

**Positive:**

- Generated frameworks use idiomatic Playwright code with no abstraction layer
- pw-gen can provide deep, accurate guidance because it focuses on one framework
- PLAYWRIGHT_ALIGNMENT.md is a meaningful document — alignment is measurable
- Engineers who learn the generated framework are learning Playwright, not a proprietary wrapper

**Negative:**

- Teams committed to Cypress or Selenium cannot use pw-gen
- If Playwright's market position changes significantly, the generator's value proposition changes with it
- All module designs must work within Playwright's architecture

---

## Future Considerations

- The Playwright-first commitment should be re-evaluated at each major Playwright version release to ensure the generator's conventions remain idiomatic.
- If a team context requires Cypress support, a separate generator project (`cypress-gen`) is preferable to making pw-gen framework-agnostic.
- AI test authoring (v2.0) will depend on Playwright's specific API surface. Framework-agnosticism would make this significantly harder to implement correctly.

# Playwright Automation Generator — Project Charter

> **pw-gen** is a CLI tool that generates enterprise-grade Playwright TypeScript
> frameworks from composable module templates.

---

## Table of Contents

- [Vision](#vision)
- [Problem Statement](#problem-statement)
- [Goals](#goals)
- [Non-Goals](#non-goals)
- [Product Philosophy](#product-philosophy)
- [Current Status](#current-status)
- [Future Vision](#future-vision)
- [Reference Documents](#reference-documents)

---

## Vision

Engineering teams should get their automation foundation in minutes, not days.

Every project should generate its own consistent, production-quality Playwright
framework that reflects current best practices from day one — not a tutorial
skeleton that requires weeks of refinement before it can be trusted for real work.

As best practices evolve, the generator evolves. All future projects inherit the
improvement automatically.

---

## Problem Statement

Most automation teams spend their first sprint assembling boilerplate instead
of writing tests.

The typical starting experience:

1. Copy from a tutorial or a previous project
2. Spend days configuring TypeScript, ESLint, fixtures, Page Objects, environments
3. Ship a framework that varies between projects and engineers
4. Inherit inconsistencies and anti-patterns that compound over time
5. Have no structured path to adopt improvements when Playwright releases new features

The problem is not capability — Playwright is excellent. The problem is the cost
of assembling a production-quality foundation before any real testing can begin.

Every project pays this cost independently, and the results are inconsistent.

---

## Goals

### Immediate Goals (v0.1 — v0.3)

- One command produces a complete, immediately runnable Playwright framework
- Generated frameworks reflect production engineering standards, not tutorial patterns
- Engineers can run `npm test` within minutes of generating a framework
- The generator encodes opinionated decisions about Page Object structure, fixture
  architecture, logging, and configuration so teams don't need to rediscover them

### Medium-Term Goals (v0.4 — v0.7)

- Optional modules (authentication, API testing, database access) can be selected
  at generation time to produce more complete frameworks for common scenarios
- A `pw-gen upgrade` command lets existing projects adopt template improvements
  without full regeneration
- Scaffolding commands (`pw-gen add page`, `pw-gen add test`) accelerate incremental
  development after initial generation

### Long-Term Goals (v1.0)

- pw-gen is the standard starting point for enterprise Playwright automation
- Pipeline generation (Azure DevOps, GitHub Actions) is included so CI/CD is
  configured alongside the test framework
- Generator code has comprehensive test coverage
- Public documentation site

### Future Vision (v2.0)

- AI-assisted test authoring: natural language → Page Objects and test skeletons
- Screenshot → locator suggestion
- Test coverage gap analysis

---

## Non-Goals

**pw-gen is not:**

- **A test runner.** Tests are executed via Playwright (`npx playwright test`), not
  via pw-gen. pw-gen produces the framework that Playwright runs.

- **A runtime library.** There is no `@pw-gen/core` package. Generated code has no
  dependency on the generator after generation is complete.

- **A hosted service.** pw-gen is a CLI tool that runs locally as part of a developer
  or team-lead's setup workflow.

- **A Playwright replacement.** pw-gen generates frameworks that use Playwright. It
  does not extend, wrap, or replace any of Playwright's core functionality.

- **A replacement for engineering judgment.** Generated frameworks are starting points.
  Engineers are expected to adapt locators, implement assertions, and evolve the
  framework for their specific application.

- **A universal template for all team sizes.** pw-gen defaults are optimized for
  enterprise teams on shared environments — not for solo developers, open-source
  projects, or highly distributed teams.

---

## Product Philosophy

### Enterprise-First Defaults

Every configuration decision is optimized for enterprise teams running against
shared environments, not for tutorial examples or personal projects.
`fullyParallel: false`, `retries: 1` on CI, and Chromium-primary are all intentional
choices for the enterprise context.

See [PLAYWRIGHT_ALIGNMENT.md](PLAYWRIGHT_ALIGNMENT.md) for every divergence from
Playwright's defaults and the engineering rationale behind each decision.

### Code Ownership

Generated code belongs to the team that generated it. There is no shared runtime
library, no forced upgrade cycle, and no black box. Every file in the generated
framework is readable, modifiable, and owned by the automation engineer.

Upgrades are opt-in: teams choose when to regenerate or adopt template improvements.
They are never forced into a breaking change by a library version bump.

### No Magic

The generator is a one-time scaffolding tool. After generation, the project is a
standard Playwright TypeScript project with standard dependencies. No pw-gen tooling
is required to run, debug, or extend the generated framework.

### Starting Point, Not Contract

The generator encodes current best practices. Teams fork from that baseline and
evolve their framework for their application's specific requirements. The `LoginPage`
template has adaptation comments precisely because pw-gen cannot know the target
application's locators or authentication mechanism.

### Templates Are Governance

When a better practice is identified, the template is updated once. All future
projects inherit the improvement automatically. Templates are the living documentation
of what "enterprise Playwright automation" means — they are not static artifacts.

---

## Current Status

**v0.1.0 — MVP Complete** _(2026-07-03)_

The generation pipeline is fully operational. A single `pw-gen new` command produces:

- A complete Playwright TypeScript project (13 files)
- Enterprise-grade `BasePage` with a full production helper set
- `LoginPage` template with environment-driven credentials
- Typed fixture architecture with automatic lifecycle logging
- Login smoke test that passes out of the box
- Self-documenting generated `README.md`

See [CHANGELOG.md](CHANGELOG.md) for the full capability list.

The next planned release is **v0.2 — Playwright Excellence**, which closes all known
gaps between the generated framework and Playwright's official best practices.

---

## Future Vision

The long-term vision for pw-gen is an **enterprise automation platform**:

- An AI-assisted test authoring layer that generates Page Objects from screenshots
  and test steps from natural language descriptions
- A module ecosystem covering authentication, API testing, database seeding, and
  custom reporting
- A pipeline provider system that generates CI/CD configurations alongside the test
  framework for Azure DevOps, GitHub Actions, and other platforms
- A web UI for organisations that prefer GUI-based project creation over CLI flags

The foundation built in v0.1 — the typed context contract, the composable module
system, and the staged rendering pipeline — is designed to accommodate this vision
without requiring architectural rework.

---

## Reference Documents

| Document                                           | Purpose                                                   |
| -------------------------------------------------- | --------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Generator engine, CLI, module system, generation pipeline |
| [ROADMAP.md](ROADMAP.md)                           | Versioned product releases and planned capabilities       |
| [PLAYWRIGHT_ALIGNMENT.md](PLAYWRIGHT_ALIGNMENT.md) | Adopted vs. deferred vs. diverged Playwright decisions    |
| [CHANGELOG.md](CHANGELOG.md)                       | Product capabilities delivered per release                |
| [DECISIONS.md](DECISIONS.md)                       | Chronological engineering decision log                    |
| [adr/](adr/)                                       | Architecture Decision Records — full context per decision |

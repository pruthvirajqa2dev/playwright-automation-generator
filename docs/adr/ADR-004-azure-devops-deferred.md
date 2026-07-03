# ADR-004 — Azure DevOps Integration Intentionally Deferred

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-15 |
| **Deciders** | Core team  |

---

## Decision

Azure DevOps pipeline generation, YAML template creation, and any CI/CD
integration features will not be implemented until the generated framework
foundation is production-ready and validated.

---

## Context

A key long-term goal of pw-gen is to generate not just the framework, but also
the Azure DevOps pipeline configuration that runs it. This would include
multi-stage YAML pipelines, variable group references, artifact publishing,
and test result integration.

The question was whether to build this capability in parallel with the
framework generator, or to defer it until the framework it generates is solid.

---

## Reasoning

Azure DevOps integration was deferred for the following reasons:

1. **The framework must exist before the pipeline can run it.** A CI/CD
   generator that targets a poorly-designed or unstable framework would require
   continuous rework as the framework evolves. Stabilising the framework first
   reduces the surface area of change.

2. **Pipeline generation is additive, not foundational.** CI/CD configuration
   wraps the framework — it does not change what the framework does. It can be
   added at any point without requiring architectural changes to the generator.

3. **Scope control.** Building CI/CD generation in parallel with the core
   framework would spread design effort across two complex domains simultaneously.
   Focusing on the framework first produces a cleaner result in both areas.

4. **The vertical slice validation.** The initial milestone goal was to prove
   the generation pipeline end-to-end: one command, one generated framework, one
   passing test. Adding CI/CD to this validation would have obscured whether
   the core generation pipeline was working correctly.

5. **Framework conventions must be stable before CI/CD encodes them.** The
   pipeline generator will reference specific npm script names (`npm test`,
   `npm run test:uat`), artifact paths (`test-results/`, `playwright-report/`),
   and environment variable names. These must be stable before being hardcoded
   into CI/CD templates.

---

## Consequences

**Positive:**

- The core framework generation is well-designed and validated before CI/CD encoding begins.
- Framework conventions (script names, artifact paths, env vars) are locked before being referenced in pipeline templates.
- The team can deliver a working framework generator without CI/CD complexity blocking progress.

**Negative:**

- Teams using pw-gen must configure their own Azure DevOps pipelines manually until this module is implemented.
- The `.env.example` template documents the expected environment variables but does not produce pipeline YAML.

---

## Future Considerations

When Azure DevOps integration is implemented, it should be a separate `azure-devops`
module that contributes:

- A multi-stage `azure-pipelines.yml` referencing the generated `npm` scripts
- Variable group documentation or a template variable group JSON
- Artifact publishing steps for `playwright-report/` and `test-results.json`
- Pull request validation gate configuration
- Optional sharding configuration for large test suites

The module should parameterise agent pool names, variable group names, and
environment names using the same `TemplateContext` used by all other modules.

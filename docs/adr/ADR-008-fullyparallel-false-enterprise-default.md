# ADR-008 — `fullyParallel: false` as the Enterprise Default

| Field             | Value      |
| ----------------- | ---------- |
| **Status**        | Accepted   |
| **Date**          | 2026-07-03 |
| **Deciders**      | Core team  |
| **Gap reference** | G4         |

---

## Decision

The generated `playwright.config.ts` will default to `fullyParallel: false`,
diverging from Playwright's own configuration template which uses
`fullyParallel: true`. The config comment will be updated to explain the
trade-off and describe the conditions under which teams should switch.

---

## Context

Playwright's `fullyParallel` setting controls whether all tests across all files
run concurrently. When `true`, Playwright distributes tests across worker
processes regardless of which file they belong to.

Playwright's official basic configuration template uses `fullyParallel: true` as
the default — appropriate for a framework whose primary audience includes
isolated unit-style frontend tests running against a local dev server.

The generated framework targets enterprise UI automation against _deployed
environments_ (UAT, staging, production) with the following characteristics:

- **Shared test data.** The same test database is used by all concurrent workers.
  Test A creates a record that Test B queries; without ordering guarantees, Test B
  may run before Test A.

- **Shared test user accounts.** Without `storageState`, each worker logs in as
  the same user. Concurrent sessions on the same account can corrupt session state
  in some applications.

- **Stateful backend workflows.** Enterprise applications (invoicing, payroll,
  CRM) have multi-step workflows where a record must be in a specific state before
  the next operation. Parallel execution without explicit state management leads
  to race conditions.

- **Authentication not yet isolated.** Until the auth module delivers
  `storageState`-based session management, each test creates its own session.
  Concurrent sessions multiply login time rather than saving it.

---

## Alternatives Considered

### Option A — Default `fullyParallel: true` (Playwright default)

Aligns with Playwright's recommendation and forces teams to think about
test isolation from day one.

**Why rejected:**

Teams generating a framework for an existing enterprise application commonly
have an existing test suite that assumes sequential execution. Defaulting to
parallel and having tests fail intermittently due to shared state creates a poor
first experience and obscures whether failures are real bugs or isolation issues.

A `false` default is safe out of the box. Teams with properly isolated tests
can opt in to `true` with a one-line change. Teams who haven't isolated their
tests have no immediate pressure to do so.

### Option B — Default `fullyParallel: true` with a warning comment

Keeps the Playwright default but adds a prominent comment warning about shared state.

**Why rejected:**

A warning comment on a setting that is actively causing test failures is not
useful guidance. Engineers change the setting to `false` without understanding
why it failed; the comment is skipped. The safe default prevents the failure
entirely.

### Option C — `fullyParallel: false` with upgrade guidance (selected)

Default `false`, with a detailed comment explaining:

1. Why the default is conservative
2. The conditions required for safe parallel execution
3. The specific setting to change and what to change it to

This turns the config comment into actionable documentation rather than a
description of what the setting does.

---

## Reasoning

1. **Safe defaults reduce time-to-first-green.** The primary success metric for
   the generated framework is that it runs without errors on first use. A
   `fullyParallel: true` default that immediately produces flaky failures due to
   shared state undermines this goal.

2. **Enterprise environments are stateful by nature.** Playwright's target
   audience for `fullyParallel: true` is teams with isolated test data and local
   dev servers. Enterprise applications run against shared staging databases with
   real business data. The contexts are different enough to justify different
   defaults.

3. **Opt-in is safer than opt-out.** Enabling `fullyParallel: true` requires the
   engineer to understand what they are doing. Disabling it after tests have started
   failing requires debugging shared-state race conditions, which is harder.

4. **The auth module will unlock parallel execution correctly.** When `storageState`
   is available, each worker uses a separate authenticated session and separate
   test data, making parallel execution safe. The config comment will point teams
   to the auth module documentation as the upgrade path.

---

## Consequences

**Positive:**

- Generated framework is safe to run immediately against shared environments
- No test failures due to shared state on first use
- Comment provides a clear upgrade path when isolation is established

**Negative:**

- Diverges from Playwright's official default
- Single-worker sequential execution is slower than necessary for teams with
  properly isolated tests
- May reinforce bad habits (no test isolation) if the upgrade path comment is ignored

---

## Future Considerations

The generated `playwright.config.ts` comment should be updated to read:

> _"Sequential execution — safe for shared environments without test data isolation._
> _To enable parallel execution: add the auth module (`pw-gen add auth`), configure_
> _`storageState` for each worker, isolate test data per worker, then set this to `true`."_

When the auth module is installed, the module's configuration step should offer
to set `fullyParallel: true` automatically if the team confirms they have isolated
test data.

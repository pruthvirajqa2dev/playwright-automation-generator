# ADR-007 — `storageState` Authentication Pattern Deferred to Auth Module

| Field             | Value      |
| ----------------- | ---------- |
| **Status**        | Accepted   |
| **Date**          | 2026-07-03 |
| **Deciders**      | Core team  |
| **Gap reference** | G1         |

---

## Decision

The `storageState` authentication pattern — authenticate once, persist browser
state to `playwright/.auth/*.json`, reuse across tests — will **not** be
implemented in the `core` module template. It will be delivered as a complete,
opinionated implementation in the `auth` module (Milestone 2).

The `core` module's `LoginPage` template is retained as a Page Object _pattern
demonstration_, not a production authentication implementation.

---

## Context

Playwright's recommended authentication approach for most enterprise applications is:

1. A dedicated `auth.setup.ts` setup test that performs the UI login once
2. Persists the resulting browser state (cookies, localStorage, sessionStorage)
   to `playwright/.auth/user.json`
3. A `setup` project in `playwright.config.ts` that runs before all test projects
4. All test projects declare `dependencies: ['setup']` and set
   `storageState: 'playwright/.auth/user.json'`

This eliminates redundant UI login sequences — a test suite with 100 tests
performs 1 login instead of 100.

The generated framework currently calls `loginPage.loginWithEnvCredentials()`,
which performs a full UI login in every test that requires an authenticated state.

---

## Alternatives Considered

### Option A — Add `storageState` skeleton to `core` module

Add `tests/auth.setup.ts`, update `playwright.config.ts` with a `setup` project,
create `playwright/.auth/`, add it to `.gitignore`.

**Why rejected:**

The skeleton would be non-functional until the team:

1. Implements `LoginPage.expectLoginSuccess()` for their application
2. Configures `URL`, `USERID`, and `PASSWORD` in `.env`
3. Understands the setup/dependency project model

A non-functional skeleton in the core module creates confusion: the generated
framework would have a `auth.setup.ts` that fails immediately, and engineers
would need to understand why before they can run any test. The current pattern
(login per test, replace when ready) is immediately runnable and clearly labelled
as a starting point.

### Option B — Add `storageState` as a flag in the core module

Make `storageState` opt-in via a CLI flag (`--with-auth-setup`) that generates
the skeleton alongside the core framework.

**Why rejected:**

The flag creates partial implementations. The `auth` module will deliver a
complete, tested, documented authentication setup. A flag in `core` would deliver
a partial, undocumented skeleton — the worst of both options.

### Option C — Deliver `storageState` in Auth Module (selected)

The auth module will deliver:

- `tests/auth.setup.ts` — a functional setup project
- Updated `playwright.config.ts` with setup project dependencies
- `playwright/.auth/` directory creation and `.gitignore` entry
- Worker-scoped fixture for parallel multi-user authentication
- Role-based authentication support (`admin.json`, `user.json`)
- Documentation for session expiry handling

This is the complete pattern, not a skeleton.

---

## Reasoning

1. **The core module is a demonstration.** The `LoginPage` demonstrates how to
   write a Page Object for an authentication screen. It is not intended to be
   a production authentication implementation. The comment in `LoginPage.ts`
   already says: "implement `expectLoginSuccess()` for your application."

2. **Partial implementations cause more confusion than omissions.** An
   `auth.setup.ts` that cannot run until several prerequisites are met is harder
   to explain than "authentication state management is in the auth module."

3. **The auth module is the right boundary.** Authentication has its own
   concerns: session management, token expiry, multi-role support, credential
   security. These belong together in one cohesive module, not split across
   core and auth.

4. **The generated framework is still immediately useful.** Teams can write and
   run non-authenticated tests, configure `LoginPage` for their application, and
   add the auth module when they need scalable authentication.

---

## Consequences

**Positive:**

- Core module is clean and immediately runnable without any configuration
- Auth module delivers the complete pattern correctly, not a partial skeleton
- Teams understand the separation: core = structure, auth = session management

**Negative:**

- Teams building authenticated test suites before Milestone 2 must implement
  `storageState` manually
- The `loginPage` fixture in `fixtures/test.ts` is under-utilised until the
  auth module replaces it with a session-backed authenticated page fixture
- CI runs will be slower than necessary for authenticated suites until the
  auth module is available

---

## Future Considerations

The auth module (Milestone 2) will:

- Replace `loginPage` fixture with an authenticated `page` fixture that
  uses `storageState` automatically
- Support multiple authentication roles via separate storage state files
- Provide worker-scoped fixtures for parallel-safe authenticated test execution
- Document session expiry detection and automatic re-authentication

When the auth module is installed, `LoginPage.loginWithEnvCredentials()` becomes
the implementation detail inside `auth.setup.ts`, not something called in every test.

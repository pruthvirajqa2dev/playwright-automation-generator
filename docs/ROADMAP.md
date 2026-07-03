# Roadmap — Playwright Automation Generator

Progress tracker for pw-gen milestones. Checked items are complete and in `main`.

---

## ✅ Milestone 0 — Vertical Slice (Complete)

> **Goal:** Prove the generation pipeline end-to-end.
> One command → one generated framework → one passing Playwright test.

- [x] CLI entry point (`pw-gen new`) with Commander.js
- [x] Zod schema validation for all user input
- [x] `ContextBuilder` — config → typed `TemplateContext`
- [x] `TemplateRenderer` — EJS rendering to in-memory `StagedFile[]`
- [x] `FileWriter` — atomic write of staged files to output directory
- [x] `ModuleRegistry` — module resolution with `alwaysIncluded` support
- [x] `core` module manifest — 13 generated files
- [x] Generated framework: compiles with `tsc --noEmit`, zero errors
- [x] Generated framework: Playwright smoke test passes against `playwright.dev`
- [x] Flag-based input (`--name`, `--org`, `--app`, `--envs`, `--output`)
- [x] JSON config file input (`--config pw-gen.config.json`)

---

## ✅ Milestone 1 — Enterprise Core Foundation (Complete)

> **Goal:** Replace all sample/placeholder artifacts with production-quality
> equivalents. Every file the generator produces should be something a real
> automation engineer would use on their first day.

- [x] **BasePage** — extended with full enterprise helper set:
  - [x] `waitForElement()` — waits for element visibility
  - [x] `waitForLoadingIndicator()` — waits for spinner/overlay to disappear
  - [x] `waitForNetworkIdle()` — waits for network idle state
  - [x] `isVisible()` — non-throwing boolean visibility check
  - [x] `expectHidden()` — assertion for hidden/detached elements
  - [x] `expectToast()` — toast/notification message verification
  - [x] `scrollIntoView()` — scroll element into viewport

- [x] **LoginPage** — production-quality authentication Page Object:
  - [x] Replaces `SamplePage`
  - [x] Private readonly locators with adaptation comments
  - [x] `login(username, password)` — form submission
  - [x] `loginWithEnvCredentials()` — ENV-driven authentication
  - [x] `expectOnLoginPage()` — login page load assertion
  - [x] `expectLoginSuccess()` — post-login state assertion (implementation required)
  - [x] `expectLoginError()` — error message assertion

- [x] **Fixture architecture** — typed, extensible fixture set:
  - [x] `loginPage` fixture — pre-instantiated `LoginPage`
  - [x] `_testLifecycle` auto-fixture — logs start/pass/fail for every test
  - [x] `AppFixtures` type exported for downstream extension

- [x] **Login smoke test** — replaces `sample.spec.ts`:
  - [x] Passes out of the box against `playwright.dev`
  - [x] Demonstrates `test.step()`, logger, annotations, screenshot, ENV
  - [x] Commented template for full login flow (ready to uncomment)
  - [x] Tagged `@smoke`

- [x] **Structured logger** — improved logger format:
  - [x] Padded level field for log alignment
  - [x] Colorized locally, plain text in CI

- [x] **Enterprise README template** — self-documenting generated framework:
  - [x] Complete folder structure
  - [x] Page Object conventions table
  - [x] Test conventions and imports guide
  - [x] Fixture usage documentation
  - [x] Logging levels reference
  - [x] Environment configuration guide
  - [x] CI integration reference

- [x] **Build script** — templates automatically copied to `dist/` after `tsc`

---

## ⬜ Milestone 2 — Authentication Module

> **Goal:** Deliver a reusable, secure authentication utility that generated
> frameworks can optionally include.

- [ ] `auth` module manifest and templates
- [ ] AES-256 encrypted credential store (replaces plaintext `.env` credentials)
- [ ] Session storage — save authenticated browser state to disk
- [ ] Authenticated page fixture — reuses saved session, skips login UI per test
- [ ] Session expiry detection and automatic re-authentication
- [ ] Multi-user support (admin, standard, read-only personas)
- [ ] Integration with generated `LoginPage`

---

## ⬜ Milestone 3 — API Module

> **Goal:** Generate an API testing layer alongside the UI framework so
> teams can write API tests and use the API for test data setup.

- [ ] `api` module manifest and templates
- [ ] `ApiClient` base class — Playwright `APIRequestContext` wrapper
- [ ] Typed response helpers — `expectStatus()`, `expectBodyContains()`
- [ ] Authentication header injection (Bearer token, API key)
- [ ] API fixture — `apiContext` in the extended test object
- [ ] Example API smoke test template

---

## ⬜ Milestone 4 — Reporting & Observability

> **Goal:** Produce richer test results that are useful in CI dashboards
> and sprint reviews.

- [ ] Custom HTML report theme (organisation branding via config)
- [ ] Test result trend tracking (JSON history)
- [ ] Failure screenshot comparison (current vs baseline)
- [ ] Accessibility scan integration (axe-core) — optional flag

---

## ⬜ Milestone 5 — Azure DevOps Module

> **Goal:** Generate the Azure DevOps pipeline configuration alongside
> the test framework.

- [ ] `azure-devops` module manifest and templates
- [ ] Multi-stage `azure-pipelines.yml` (install → test → publish)
- [ ] Variable group documentation template
- [ ] Artifact publishing steps (HTML report, test-results.json)
- [ ] PR validation gate configuration
- [ ] Optional sharding configuration

---

## ⬜ Milestone 6 — Database & Data Module

> **Goal:** Give generated frameworks a structured way to manage test data
> via direct database access or API seeding.

- [ ] `database` module manifest
- [ ] Typed database client wrapper (configurable: MSSQL, PostgreSQL)
- [ ] Test data factory pattern
- [ ] Automatic test data teardown via fixtures
- [ ] Data seeding smoke test template

---

## ⬜ Milestone 7 — Framework Upgrade Engine

> **Goal:** Allow existing generated projects to adopt template improvements
> without full regeneration.

- [ ] `pw-gen upgrade` command
- [ ] Diff view: current generated files vs latest template output
- [ ] Selective file adoption (upgrade specific files only)
- [ ] Upgrade history tracking (generated-at metadata per file)
- [ ] Conflict detection for files modified after generation

---

## ⬜ Milestone 8 — AI Test Author

> **Goal:** Use LLM capabilities to generate Page Objects and test cases
> from natural language descriptions or application screenshots.

> Prerequisites: Milestone 1 complete, framework conventions locked and documented.

- [ ] Natural language → `test.step()` skeleton generation
- [ ] Screenshot → Page Object locator suggestion
- [ ] Test coverage gap analysis (pages with no tests)
- [ ] Generated test quality review (hallucination detection)

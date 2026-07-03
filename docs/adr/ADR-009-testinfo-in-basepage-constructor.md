# ADR-009 — `TestInfo` Retained in `BasePage` Constructor

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Core team |
| **Gap reference** | G5 |

---

## Decision

`BasePage` will retain `TestInfo` as an explicit constructor parameter:
`constructor(page: Page, testInfo: TestInfo)`. This diverges from the Playwright
official Page Object Model documentation, which uses `constructor(page: Page)` only.

---

## Context

The official Playwright POM documentation shows:

```typescript
class PlaywrightDevPage {
    readonly page: Page;
    constructor(page: Page) {
        this.page = page;
    }
}
```

The generated `BasePage` uses:

```typescript
abstract class BasePage {
    protected readonly page: Page;
    protected readonly testInfo: TestInfo;

    constructor(page: Page, testInfo: TestInfo) {
        this.page = page;
        this.testInfo = testInfo;
    }

    async takeScreenshot(name: string): Promise<void> {
        const filePath = this.testInfo.outputPath(`${name}.png`);
        await this.page.screenshot({ path: filePath, fullPage: false });
        await this.testInfo.attach(name, { path: filePath, contentType: "image/png" });
    }
}
```

The difference is that the generated `BasePage` injects `TestInfo` to support
screenshot attachment and `outputPath()` access from within Page Object methods.

---

## Alternatives Considered

### Option A — `constructor(page: Page)` only (Playwright official pattern)

Removes `TestInfo` from the constructor. Page Objects have no access to test
lifecycle information.

**Consequences:**
- `takeScreenshot()` cannot be a `BasePage` method — it must move to the fixture
  or be called directly in tests
- Tests become more verbose: instead of `await loginPage.takeScreenshot("step-1")`
  inside a `test.step()`, engineers call `await page.screenshot({ path: ... })`
  and `await testInfo.attach(...)` manually
- Every test file that wants screenshots must destructure `testInfo` from the
  test function, even when the screenshot call is the only reason it's needed

**Why rejected:**

Removing `takeScreenshot()` from `BasePage` reduces the Page Object's utility.
One of the most valuable features of enterprise Page Objects is the ability to
attach evidence screenshots at the right points in a workflow — after login,
after a form submission, after a navigation. This is a pattern that every
enterprise automation engineer expects from a base class.

### Option B — Acquire `TestInfo` via `test.info()` (global function)

Use Playwright's global `test.info()` function inside `BasePage` methods,
removing the need to inject `TestInfo` through the constructor.

```typescript
import { test } from "@playwright/test";

async takeScreenshot(name: string): Promise<void> {
    const testInfo = test.info(); // global access
    const filePath = testInfo.outputPath(`${name}.png`);
    // ...
}
```

**Why rejected:**

1. **Implicit dependency.** `test.info()` is only valid when called from within
   a test function or fixture. Calling it outside a test context throws an error.
   Using a global function inside a Page Object creates an invisible coupling that
   is not apparent from the class signature.

2. **Harder to test in isolation.** A Page Object that uses `test.info()` cannot
   be instantiated and tested outside of a Playwright test runner context.
   A Page Object that accepts `TestInfo` as a constructor argument can be
   constructed with a mock in unit tests.

3. **Breaks the explicit dependencies principle.** The constructor is a contract
   stating what the class needs to operate. Moving `TestInfo` from an explicit
   parameter to a global lookup hides the dependency without removing it.

### Option C — Move screenshot attachment to fixture teardown

After `use()` in the fixture, capture a screenshot and attach it automatically
regardless of which page object is active.

**Why rejected:**

This captures screenshots only in fixture teardown — after the test has completed.
It does not support mid-test evidence capture (after login, after a critical step,
before a complex assertion). Enterprise audit evidence requires screenshots at
specific workflow points, not just at the end.

### Option D — Explicit `TestInfo` injection (selected)

Keep `TestInfo` as an explicit constructor parameter. Accept the verbosity of
`new LoginPage(page, testInfo)` as the price for explicit dependencies, in-method
screenshot attachment, and clear testability.

---

## Reasoning

1. **Evidence attachment at workflow boundaries.** Enterprise automation often
   requires screenshots as audit evidence — proof that the system was in a
   specific state at a specific point in the workflow. This cannot be done in
   teardown; it must be done inline.

2. **Explicit dependencies are visible dependencies.** Any engineer reading
   `new DashboardPage(page, testInfo)` knows immediately that the page object
   requires both `page` and test lifecycle information. There is no hidden
   coupling.

3. **The Playwright official POM examples are minimal by design.** The official
   documentation prioritises clarity for new learners. It does not represent the
   complete set of patterns needed for enterprise automation. The official POM
   does not include logging, screenshot attachment, or loading indicator handling
   either — these are enterprise additions that extend beyond the tutorial scope.

4. **Constructor parameter vs. global state.** In the context of parallel test
   execution, each test has its own `TestInfo` instance. Injecting it explicitly
   ensures each Page Object instance is bound to the correct test's lifecycle,
   even when multiple tests run concurrently.

---

## Consequences

**Positive:**
- `takeScreenshot()` is available in every Page Object without additional imports
- Test evidence can be captured at any point in a workflow
- Dependencies are explicit and visible in the constructor signature
- Page Objects can be tested in isolation with a mocked `TestInfo`

**Negative:**
- Constructor is more complex than the minimal `constructor(page: Page)` pattern
- Every test that creates a Page Object must have `testInfo` in scope (available
  as the second argument to the test function, or via `test.info()`)
- Slightly higher verbosity: `new DashboardPage(page, testInfo)` vs `new DashboardPage(page)`

---

## Future Considerations

- If Playwright adds a native mechanism for Page Objects to access test context
  (similar to Vue's `inject` or Angular's DI), this decision should be revisited.
- The `testInfo` parameter could be made optional with a default no-op implementation,
  reducing verbosity for tests that don't need screenshot attachment. This is
  deferred until there is a concrete use case.

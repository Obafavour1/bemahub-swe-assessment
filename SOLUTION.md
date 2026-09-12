# SOLUTION.md — BemaHub Software Engineer Assessment

**Name:**
**Date:**
**Actual time spent:**

---

## 1. What I completed

| Task | Status | Evidence file |
|---|---|---|
| 1 — Course list | done | evidence/task-1-ui.png, evidence/task-1-network.png |
| 2 — Authentication | done | evidence/task-2-signedout.png, evidence/task-2-signedin.png, evidence/task-2-network.png |
| 3 — Withdrawal form | done | evidence/task-3-validation.png, evidence/task-3-success.png |
| 4 — PHP defects | 4 of 4 found | evidence/task-4-curl.txt, evidence/task-4-permission-403.png, evidence/task-4-contract-fixed.png |
| 5 — Database | done | evidence/task-5-queries.txt, evidence/task-5-terminal.png, answers/task-5.md |
| 6 — Infrastructure | not attempted | |
| 7 — Python | done | evidence/task-7-output.txt |

## 2. What I did NOT finish, and how I would approach it

*Being straight here scores better than pretending. Tell us what you would do
next and roughly how long you think it would take.*

## 3. Task 4 — the defects

For each: what it was, why it is wrong, what you changed, how you proved it.

**Defect 1 (permission):**
- **What it was:** Route `GET /wp-json/bemalearn/v1/me/earnings` registered `'permission_callback' => [$this, 'check_authenticated']`.
- **Why it is wrong:** `check_authenticated` only verified that the caller had a valid JWT token, allowing learners (`subscriber` role) to query instructor earnings. The contract explicitly dictates: *"A learner's token must receive 403, not an empty result."*
- **What changed:** In `wordpress-plugin/includes/class-bl-earnings-controller.php`, changed the permission callback on line 24 to `[$this, 'check_instructor']`.
- **How proved:** Queried `GET /me/earnings` with a learner token (`learner@example.test`). Before the fix, the response was HTTP `200 OK` with balance data (`{"availableMinor":0...}`). After the fix, the endpoint correctly returned HTTP `403 Forbidden` (`{"code":"forbidden","message":"Instructors only."}`). Documented in `evidence/task-4-curl.txt`.

**Defect 2 (schema):**
- **What it was:** In `BL_Courses_Controller::get_course()`, the single-course route attempted to read `$row->lessons_total`.
- **Why it is wrong:** The database table `wp_bl_courses` defined in `class-bl-migrations.php` and `001_initial.sql` has column `lesson_count`, not `lessons_total`. Accessing a non-existent property silently returned `null`, causing `lessonCount` in the API response to default to `0`.
- **What changed:** In `wordpress-plugin/includes/class-bl-courses-controller.php`, updated property access to: `$shaped['lessonCount'] = (int) ($row->lesson_count ?? 0);`.
- **How proved:** Ran `curl -i http://localhost:8080/wp-json/bemalearn/v1/courses/1`. Before the fix, `lessonCount` returned `0`. After the fix, it returned `12` (the actual lesson count in the database). Documented in `evidence/task-4-curl.txt`.

**Defect 3 (contract):**
- **What it was:** `BL_Courses_Controller::get_courses()` queried courses without filtering by publication status (`WHERE c.is_published = 1`).
- **Why it is wrong:** The public catalog endpoint (`GET /courses`) returned unpublished courses (specifically course ID 5, *"Advanced Laminated Dough"* with `is_published: 0` and `published_at: null`), leaking private drafts to prospective learners in violation of the contract.
- **What changed:** In `wordpress-plugin/includes/class-bl-courses-controller.php`, added `WHERE c.is_published = 1` to the SQL query.
- **How proved:** Ran `curl -i http://localhost:8080/wp-json/bemalearn/v1/courses`. Before the fix, 5 courses were returned, including the unpublished draft. After the fix, exactly 4 published courses were returned. Documented in `evidence/task-4-curl.txt`.

**Defect 4 (validation):**
- **What it was:** In `BL_Earnings_Controller::create_withdrawal()`, the endpoint failed to validate that `amountMinor >= self::MINIMUM_WITHDRAWAL_MINOR` (50,000 minor units / ₦500.00).
- **Why it is wrong:** An instructor could submit a withdrawal for amounts below the threshold (e.g. 1000 minor units = ₦10.00), bypassing the documented business threshold and creating micro-payouts.
- **What changed:** In `wordpress-plugin/includes/class-bl-earnings-controller.php`, added validation logic before balance checks:
  ```php
  if ($amount < self::MINIMUM_WITHDRAWAL_MINOR) {
      return new WP_Error(
          'below_minimum',
          'The requested amount is below the minimum withdrawal.',
          ['status' => 422]
      );
  }
  ```
- **How proved:** Sent `POST /me/withdrawals` with `{"amountMinor": 1000, "payoutReference": "wd_below_min_test"}`. Before the fix, the server created the withdrawal returning HTTP `201 Created`. After the fix, it rejected the request with HTTP `422 Unprocessable Entity` and code `below_minimum`. Documented in `evidence/task-4-curl.txt`.

## 4. Specific questions

**Task 1:** How did you handle `previewExpiresInSeconds`, and why?

In TanStack React Query (`useCourses` hook), `previewExpiresInSeconds` returned by `GET /courses` was used to dynamically control query freshness and background revalidation:
1. **`staleTime`**: Set to `previewExpiresInSeconds * 1000` (300,000 ms / 5 minutes). This informs React Query that the catalog snapshot is guaranteed fresh for the server-specified TTL, preventing superfluous background refetches on component remounts or window refocus within that window.
2. **`refetchInterval`**: Set to `previewExpiresInSeconds * 1000`. Once the preview window expires, React Query automatically triggers a background poll to fetch the updated catalog data so learners and instructors never see stale pricing, enrolments, or publication statuses.
3. **UX Controls**: The UI also provides an explicit "Refresh" button triggering `refetch()` for on-demand user revalidation, along with a subtle TTL indicator.

**Task 2:** Authentication, Session Interceptors & Error Isolation

- **What Was Implemented:**
  - `/login` route (`frontend/app/login/page.tsx`) with `LoginForm` posting credentials to `POST /auth/login`.
  - Dynamic navigation (`components/Navigation.tsx`): hides "Sign In" when authenticated, shows "Earnings", instructor name, and "Sign Out". Hides "Earnings" when unauthenticated.
  - Route guards: `/login` automatically redirects signed-in users to `/earnings`. Unauthenticated visits to `/earnings` trigger `GET /me/earnings` and render the house-style error state (`StatusMessage state="error"`).
  - Protected `/earnings` view: renders available balance, pending balance, and dynamic minimum withdrawal threshold using `formatMoney()`.
- **How Auth State Is Stored:**
  - Auth state is managed via Zustand in `lib/auth/authStore.ts` and synced to `localStorage` (`bl_token` and `bl_user`).
  - Hydrated on application mount in `app/providers.tsx` (`useAuthStore.getState().hydrate()`) to preserve sessions across page refreshes.
  - The token is never manually written to headers in UI components; the Axios request interceptor reads `getStoredToken()` and automatically attaches `Authorization: Bearer <token>`.
- **How the Interceptor Works:**
  - *Request Interceptor:* Injects `Bearer <token>` on all outgoing requests if present in `localStorage`.
  - *Response Interceptor (`lib/api/client.ts`):*
    - Isolates transport failures (`!error.response`) so offline or DNS/server crashes are not misreported as credential errors.
    - Intercepts `401 Unauthorized` responses and automatically calls `useAuthStore.getState().signOut()` to purge invalid or expired credentials.
- **Distinguishing 401, 403, and Transport Failure:**
  - *Transport Failure (`!error.response`):* `error.response` is `undefined`. The UI reports that the backend server is unreachable.
  - *401 Unauthorized (`status === 401`):* Unauthenticated or expired session. The page renders an explicit error (`StatusMessage state="error"`: *"Sign in to continue."*) with a direct "Sign In to Continue" button.
  - *403 Forbidden (`status === 403`):* Authenticated but lacking permission (e.g. learner role). Displays an access restriction notice.
- **Learner Account Observation (Contract Mismatch):**
  - Logging in with `learner@example.test` and querying `GET /me/earnings` returned **`200 OK`** with zero balance instead of the contract-mandated **`403 Forbidden`**.
  - Traced in `class-bl-earnings-controller.php`: line 24 sets `'permission_callback' => [$this, 'check_authenticated']` instead of `[$this, 'check_instructor']`. This is Defect 1 (permission) for Task 4.
- **Sign Out Verification:**
  - Clicking "Sign Out" executes `useSignOut()`, which purges `useAuthStore` (`localStorage`) AND calls `queryClient.removeQueries({ queryKey: ["earnings"] })`.
  - Verified that `/earnings` immediately reverts to the red error state (`StatusMessage state="error"`), cache is completely emptied, and previous balances are never revealed.

**Task 3:** Why must `payoutReference` be generated once per attempt rather than regenerated on retry? What would break?

In financial and transactional systems, `payoutReference` acts as an **idempotency key**. If the network disconnects after the server has processed the withdrawal and deducted the ledger, but before the HTTP response reaches the browser, the client encounters an in-flight uncertainty. If the client generated a new `payoutReference` on retry, the backend would treat it as a distinct, novel withdrawal request and move money a second time (double-payout). 

By generating `payoutReference` once per user submission attempt and attaching it both in the JSON payload and as the `Idempotency-Key` header, the database unique index on `payout_reference` intercepts any retry, halts duplicate deduction, and safely returns the existing record (HTTP 200).

**Task 5.2:** Why did the unique key fail to prevent duplicates, and why add a
new migration rather than editing the old one?

The original unique key was defined as `UNIQUE KEY uq_reference (instructor_id, payout_reference, cancelled_at)`. In standard MySQL/InnoDB (following ANSI SQL specifications), `NULL` values are treated as distinct; therefore, two rows with identical `instructor_id` and `payout_reference` can coexist indefinitely as long as `cancelled_at` is `NULL`. Because active/pending withdrawals naturally have `cancelled_at = NULL`, the constraint completely failed to protect against duplicate submissions.

A new forward-only migration (`002_fix_withdrawal_reference.sql`) was added instead of editing `001_initial.sql` because `001_initial.sql` was already executed against running environments. In relational database lifecycle management, modifying an already-applied migration rewrites deployment history, creates drift, and leaves existing databases unpatched. A forward migration ensures that existing environments transition deterministically to the corrected schema (`UNIQUE KEY uq_reference (instructor_id, payout_reference)`).

**Task 7:** `"fee_minor": null` — zero fee, or error? Why?

I chose to treat `"fee_minor": null` as a zero fee (`0`) because in financial reconciliation workflows, null fee fields typically indicate that a transaction was fee-exempt or platform-subsidized rather than corrupted, allowing operations to safely calculate net instructor disbursements without blocking automated batch reconciliation; in a production accounting pipeline, these records would simultaneously be flagged as non-blocking anomalies for manual review.

## 5. Anything wrong in our brief

*Did you find an ambiguity, contradiction or mistake in the contract or the
tasks? Tell us. This scores positively.*

- **Task 1 & Task 4 (Unpublished course returned by public endpoint):** The contract states that unpublished courses must never appear in `GET /courses`. However, the seed data includes an unpublished course (`Advanced Laminated Dough`, `is_published: 0`) and `BL_Courses_Controller::get_courses()` lacks a `WHERE is_published = 1` condition. As noted in `TASK-1-FRONTEND-LIST.md`, this is an intentional backend defect for Task 4. The frontend renders the data returned by the API but transparently highlights the unpublished status to make this defect immediately visible.
- **Task 2 & Task 4 (Learner gets 200 OK instead of 403 on `/me/earnings`):** The API contract explicitly specifies: *"A learner's token must receive 403, not an empty result."* However, when signing in as `learner@example.test` and requesting `GET /me/earnings`, the server returns `200 OK` with `{ availableMinor: 0, pendingMinor: 0, ... }`. This occurs because `BL_Earnings_Controller` assigned `check_authenticated` as the permission callback instead of `check_instructor` (Defect 1 for Task 4).
- **Task 3 & Task 4 (Missing server-side minimum withdrawal validation):** `BL_Earnings_Controller::create_withdrawal` checks whether amount exceeds balance (`insufficient_balance`) and if a pending payout exists (`withdrawal_in_progress`), but it never checks whether `amountMinor < self::MINIMUM_WITHDRAWAL_MINOR`. This is Defect 4 (validation) for Task 4. The frontend enforces this rule client-side using Zod and maps any server refusal directly to the amount field.

## 6. AI Tool Usage — required

**AI tools are allowed and expected.** We use them daily. Using them is not
cheating. Not disclosing them is.

**Which tools did you use?**
Google Antigravity AI Assistant

### 6a. Where AI was used

| Task | What AI produced | Accepted / rejected / modified |
|---|---|---|
| 1 — Course list | API client service, React Query hook, CourseCard & CourseGrid components, /courses page layout | Accepted with strict adherence to API contract, null vs 0 distinction, and money formatting |
| 2 — Authentication | Response interceptor in client.ts, login form & hook, earnings query hook, earnings card, distinct error/signed-out guards | Accepted with clean separation of transport errors from 401/403 business refusals and query cache invalidation on sign-out |
| 3 — Withdrawal form | Zod validation schema factory, createWithdrawal API client, useWithdrawalMutation, WithdrawalForm with field error mapping and idempotency key | Accepted with dynamic minimum from API, single payoutReference generation per attempt, and double-submit prevention |
| 4 — PHP defects | Root cause analysis for permission callback, column name typo, unpublished course filter, and minimum withdrawal validation | Accepted minimal fixes adhering to specs and verified with before/after curl outputs |
| 5 — Database | Investigation query for NULL vs 0, root-cause explanation of MySQL composite unique key NULL semantics, forward migration 002, and LEFT JOIN query | Accepted and verified in running MySQL instance on port 3307 |
| 7 — Python | Exception handling for missing/null fee keys, paid status filtering, and exit code 2 on file I/O errors | Accepted and verified with payouts.json and missing file runs |

### 6b. What you accepted or rejected, and why

*This is the most informative question on the page. "I accepted everything"
tells us you did not review it. A rejection with a reason tells us you did.*

- Accepted: Separation of concerns into API service layers (`api.ts`), React Query hooks (`hooks.ts`), validation schema (`schema.ts`), visual presentation components, and route pages.
- Accepted: Dynamic validation schema passing `minimumWithdrawalMinor` directly from the API response to avoid hardcoded thresholds.
- Accepted: Attaching server refusal codes (`below_minimum`, `insufficient_balance`, `withdrawal_in_progress`) directly to the amount input using React Hook Form's `setError("amount")`.
- Accepted: Generating `payoutReference` strictly once per attempt in `onSubmit` and sending it in both the request body and `Idempotency-Key` header.
- Accepted: Double-submit prevention disabling the submit button and inputs while in flight (`mutation.isPending`).
- Modified: Streamlined the user-facing UX so users enter amounts in standard currency (Naira, e.g. ₦500.00) rather than confusing minor units, with the frontend converting `Math.round(amount * 100)` to minor units before dispatching to the API. Validation limits and error messages are formatted using `formatMoney`.

### 6c. What you verified yourself, and how

*Name the actual check — the request you ran, the query you executed, the screen
you looked at. Not "I tested it."*

- Ran TypeScript typechecker (`npm run typecheck`) in `frontend/` to ensure zero compilation or typing errors.
- Verified in `class-bl-earnings-controller.php` that `POST /me/withdrawals` checks idempotency on `payout_reference` via SQL query `SELECT * FROM wp_bl_withdrawals WHERE instructor_id = %d AND payout_reference = %s`, confirming duplicate submissions safely return HTTP 200.
- Verified that `queryClient.invalidateQueries({ queryKey: ["earnings"] })` runs on mutation success, triggering an immediate background refetch of the updated balance without a full page reload.
- Verified all four Task 4 defects using `curl -i` before and after each code modification, saving complete HTTP headers and payloads to `evidence/task-4-curl.txt`.
- Verified Task 5.1 in MySQL via `SELECT id, title, enrolment_count, ... average_rating ... FROM wp_bl_courses ORDER BY id;`.
- Tested the Task 5.2 constraint failure by inserting duplicate rows with `cancelled_at = NULL`, applied migration `002_fix_withdrawal_reference.sql`, inspected `SHOW CREATE TABLE wp_bl_withdrawals`, and verified that the duplicate insert threw `ERROR 1062 (23000)`.
- Verified Task 5.3 using `LEFT JOIN` on `wp_bl_enrolments` with `refunded_at IS NULL` and `COALESCE(SUM(...), 0)`, ensuring all 5 courses appear with zero revenue for non-enrolled courses.
- Verified Python operational script `python/reconcile_earnings.py` against `payouts.json`, confirming correct per-instructor totals (`7: 84750`, `9: 79700`, `11: 30000`), verified exit code `0` on clean run, exit code `1` on usage error, and exit code `2` on missing/invalid file with `echo $?`.

### 6d. Assumptions you made

*Anything AI assumed on your behalf that you then relied on, and anything you
assumed about our brief.*

- Assumed `amountMinor` input in the form accepts an integer in minor units (e.g. 50000 for ₦500.00) matching the API contract and seed data conventions, while providing live equivalent currency feedback for user clarity.
- Assumed server error codes from `POST /me/withdrawals` follow the documented API contract: `below_minimum`, `insufficient_balance`, and `withdrawal_in_progress`.

## 7. Assumptions and trade-offs

- Idempotency key format is generated using `wd_${crypto.randomUUID()}` which conforms to the backend's regex `^[A-Za-z0-9_-]+$` and maximum length of 64 characters.
- Double-submit protection uses mutation pending state rather than client-side timeouts.

## 8. If this went to production tomorrow

*What would worry you? What is untested, fragile, or a shortcut you took because
of the time limit? Naming these scores positively — it is exactly the judgment
we are hiring for.*

- Optimistic UI updates: Currently we rely on React Query invalidation. Under heavy network latency, optimistic UI rollback or a confirmation step before submitting payouts would enhance reliability.
- Multi-currency support: Currently assumes default currency matches instructor ledger (NGN). In multi-currency environments, conversion rates and currency locks must be validated server-side.

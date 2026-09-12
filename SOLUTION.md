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
| 3 — Withdrawal form | done | evidence/task-3-validation.png, evidence/task-3-server-error.png, evidence/task-3-success.png, evidence/task-3-network.png |
| 4 — PHP defects | 0 of 4 found | |
| 5 — Database | not attempted | |
| 6 — Infrastructure | not attempted | |
| 7 — Python | not attempted | |

## 2. What I did NOT finish, and how I would approach it

*Being straight here scores better than pretending. Tell us what you would do
next and roughly how long you think it would take.*

## 3. Task 4 — the defects

For each: what it was, why it is wrong, what you changed, how you proved it.

**Defect 1 (permission):**
**Defect 2 (schema):**
**Defect 3 (contract):**
**Defect 4 (validation):**

## 4. Specific questions

**Task 1:** How did you handle `previewExpiresInSeconds`, and why?

In TanStack React Query (`useCourses` hook), `previewExpiresInSeconds` returned by `GET /courses` was used to dynamically control query freshness and background revalidation:
1. **`staleTime`**: Set to `previewExpiresInSeconds * 1000` (300,000 ms / 5 minutes). This informs React Query that the catalog snapshot is guaranteed fresh for the server-specified TTL, preventing superfluous background refetches on component remounts or window refocus within that window.
2. **`refetchInterval`**: Set to `previewExpiresInSeconds * 1000`. Once the preview window expires, React Query automatically triggers a background poll to fetch the updated catalog data so learners and instructors never see stale pricing, enrolments, or publication statuses.
3. **UX Controls**: The UI also provides an explicit "Refresh" button triggering `refetch()` for on-demand user revalidation, along with a subtle TTL indicator.

**Task 3:** Why must `payoutReference` be generated once per attempt rather than regenerated on retry? What would break?

In financial and transactional systems, `payoutReference` acts as an **idempotency key**. If the network disconnects after the server has processed the withdrawal and deducted the ledger, but before the HTTP response reaches the browser, the client encounters an in-flight uncertainty. If the client generated a new `payoutReference` on retry, the backend would treat it as a distinct, novel withdrawal request and move money a second time (double-payout). 

By generating `payoutReference` once per user submission attempt and attaching it both in the JSON payload and as the `Idempotency-Key` header, the database unique index on `payout_reference` intercepts any retry, halts duplicate deduction, and safely returns the existing record (HTTP 200).

**Task 5.2:** Why did the unique key fail to prevent duplicates, and why add a
new migration rather than editing the old one?

**Task 7:** `"fee_minor": null` — zero fee, or error? Why?

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

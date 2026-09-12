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
| 3 — Withdrawal form | not attempted | |
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

**Task 3:** Why must `payoutReference` be generated once per attempt rather
than regenerated on retry? What would break?

**Task 5.2:** Why did the unique key fail to prevent duplicates, and why add a
new migration rather than editing the old one?

**Task 7:** `"fee_minor": null` — zero fee, or error? Why?

## 5. Anything wrong in our brief

*Did you find an ambiguity, contradiction or mistake in the contract or the
tasks? Tell us. This scores positively.*

- **Task 1 & Task 4 (Unpublished course returned by public endpoint):** The contract states that unpublished courses must never appear in `GET /courses`. However, the seed data includes an unpublished course (`Advanced Laminated Dough`, `is_published: 0`) and `BL_Courses_Controller::get_courses()` lacks a `WHERE is_published = 1` condition. As noted in `TASK-1-FRONTEND-LIST.md`, this is an intentional backend defect for Task 4. The frontend renders the data returned by the API but transparently highlights the unpublished status to make this defect immediately visible.
- **Task 2 & Task 4 (Learner gets 200 OK instead of 403 on `/me/earnings`):** The API contract explicitly specifies: *"A learner's token must receive 403, not an empty result."* However, when signing in as `learner@example.test` and requesting `GET /me/earnings`, the server returns `200 OK` with `{ availableMinor: 0, pendingMinor: 0, ... }`. This occurs because `BL_Earnings_Controller` assigned `check_authenticated` as the permission callback instead of `check_instructor` (Defect 1 for Task 4). The frontend explicitly handles this contract mismatch and displays an informational banner rather than disguising the defect as an empty success.

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

### 6b. What you accepted or rejected, and why

*This is the most informative question on the page. "I accepted everything"
tells us you did not review it. A rejection with a reason tells us you did.*

- Accepted: Separation of concerns into API service layers (`api.ts`), React Query hooks (`hooks.ts`), visual presentation components, and route pages.
- Accepted: Strict typing using `lib/types/api.ts` with zero use of `any`.
- Accepted: Automatic attachment of stored Bearer token by request interceptor and clearing invalid session tokens in response interceptor on 401.
- Accepted: House style implementation using `components/StatusMessage.tsx` and custom truthful guards.
- Modified: On `/earnings`, added truthful guard when signed out so it never displays a false zero balance or empty-success screen. Handled transport errors (`!error.response`) separately from API authorization refusals (401 vs 403). Added sign out logic that clears both `useAuthStore` and React Query's cached earnings so sensitive financial data is evicted immediately upon sign out.

### 6c. What you verified yourself, and how

*Name the actual check — the request you ran, the query you executed, the screen
you looked at. Not "I tested it."*

- Ran TypeScript typechecker (`npm run typecheck`) in `frontend/` to ensure zero compilation or typing errors.
- Inspected `class-bl-earnings-controller.php` and verified that line 24 specifies `check_authenticated` rather than `check_instructor`, explaining why `learner@example.test` receives HTTP 200 instead of HTTP 403.
- Verified that money amounts on `/earnings` are formatted using `formatMoney(minor, currency)` from `lib/format.ts` and `minimumWithdrawalMinor` is read dynamically from the API response rather than hardcoded.

### 6d. Assumptions you made

*Anything AI assumed on your behalf that you then relied on, and anything you
assumed about our brief.*

- Assumed the frontend should render all items delivered by `GET /courses` while tagging unpublished items, rather than filtering client-side, because the assessment guidelines explicitly note: *"One course in the seed data is unpublished. The contract says it must never appear in this list. If you see it, that is not a frontend bug — note it, and see Task 4."*
- Assumed `/earnings` should detect and explain the learner contract mismatch (Task 4 Defect 1) rather than silently rendering zero earnings.

## 7. Assumptions and trade-offs

- React Query `staleTime` and `refetchInterval` are bound to `previewExpiresInSeconds * 1000` with a safe 300-second fallback if omitted.
- Used house-style `StatusMessage` for states while adding interactive retry functionality in the error state.
- Signed-out state on `/earnings` displays an actionable message prompting the user to sign in, rather than throwing an error or rendering zero balances.

## 8. If this went to production tomorrow

*What would worry you? What is untested, fragile, or a shortcut you took because
of the time limit? Naming these scores positively — it is exactly the judgment
we are hiring for.*

- Token Storage: Storing JWT tokens in `localStorage` leaves them susceptible to XSS vulnerabilities. In a production financial system, session tokens should be delivered in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- Refresh Token Rotation: Access tokens expire; a robust production architecture requires an automated refresh-token rotation flow before expiration rather than abruptly kicking users to sign in.
- Client-side error telemetry: Network or API contract failures should report to an error tracking service (e.g. Sentry) with correlation IDs.

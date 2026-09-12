TASK 1

Course List — /courses

What I did

After confirming that the frontend and backend were running, I checked the existing project setup before adding anything new. I checked the API client configuration, the environment variable naming, whether TanStack Query was already installed, and whether the application already had a query provider. The provider was already present, so I did not create a duplicate global setup.

I then built the /courses feature with a small separation of concerns: the API call, the React Query hook, and the presentation components were kept apart. The page shows the title, instructor, price, enrolment count, and rating for each course.

How I handled the requirements

• I used TanStack React Query for the request rather than useEffect plus fetch.

• Loading, error, and empty states are separate. A failed request does not look like an empty successful result.

• I used explicit null checks for enrolmentCount and averageRating so null and 0 do not render the same way.

• Pastry Fundamentals shows the unknown/null state, while Cake Decorating Basics keeps its real 0.0 rating.

• Prices are formatted with the shared lib/format.ts utility instead of dividing by 100 inside the component.

• I used the supplied TypeScript response types and avoided any.

• I used previewExpiresInSeconds as the server-owned freshness window for the query rather than hardcoding a different frontend TTL.

Unpublished course observation

During the first verification, the API returned Advanced Laminated Dough even though it was unpublished. I did not add a frontend filter to hide it because the contract says the backend endpoint itself must only return published courses. I noted the issue and handled the actual fix in Task 4.

What I personally verified

• Opened /courses in the browser and checked the rendered course cards.

• Checked the DevTools Network response for GET /courses.

• Verified the null-versus-zero cases against the seeded values.

• Verified the formatted Naira values.

• Ran the TypeScript checks during the frontend work.

Evidence

• evidence/task-1-ui.png

• evidence/task-1-network.png

AI usage for Task 1

I used Google Antigravity and ChatGPT to review the feature structure and the edge cases in the brief. I accepted the React Query and feature-structure suggestions because they matched the existing application setup. I rejected the idea of hiding the unpublished course in the frontend because that would only cover up a backend contract defect. I personally ran and checked the final behavior.

TASK 2

Authentication and Protected Earnings

What I did

I implemented the login flow and the protected earnings experience. The login form posts to POST /auth/login and successful authentication is saved through the provided useAuthStore. The /earnings page reads the instructor earnings data from GET /me/earnings.

Authentication handling

• I did not manually set the Authorization header in the feature code because the supplied Axios interceptor already owns that job.

• I completed the response interceptor so that a 401 clears invalid auth state.

• I kept transport failures separate from API refusals. If error.response is undefined, the UI reports an unreachable server rather than a permission problem.

• A 403 is treated as an authenticated-but-not-permitted state.

• Signing out clears the stored auth state and removes the cached earnings query so private balance data is not left behind.

Learner account observation

I tested the learner account against /me/earnings. Before the backend fix, it returned 200 with zero balances instead of the contract-required 403. I traced this to the route using check_authenticated instead of check_instructor. This became the permission defect fixed in Task 4.

What I personally verified

• Signed-out /earnings state.

• Instructor login and earnings balance.

• Learner behavior on /earnings.

• Authorization header present on authenticated requests.

• Sign out clears both stored auth and private query cache.

Evidence

• evidence/task-2-signedout.png

• evidence/task-2-signedin.png

• evidence/task-2-network.png

AI usage for Task 2

AI helped me review the interceptor flow, the login hook structure, and the distinction between 401, 403, and transport errors. I kept the existing interceptor ownership of the Bearer header instead of duplicating that logic in components, and I personally verified the Network behavior in the browser.

TASK 3

Withdrawal Form

What I did

I added the withdrawal form to /earnings using react-hook-form, Zod, and the installed resolver package. The validation limits come from the earnings API, so minimumWithdrawalMinor and availableMinor stay server-driven.

Validation and user experience

For the user-facing form, I chose normal Naira input instead of asking the user to think in raw minor units. The value is converted to an integer minor-unit amount before the API request is sent. The form checks that the amount is positive, at least the minimum returned by the API, and no more than the available balance.

Server refusals and safe submission

• below_minimum and insufficient_balance are attached to the amount field rather than shown only in a general banner.

• The submit button and amount input are disabled while the mutation is pending to prevent double submission.

• payoutReference is generated once per withdrawal attempt.

• The same payoutReference is sent in the request body and as the Idempotency-Key header.

• On success, I invalidate the earnings query and refetch the balance from the server.

Why payoutReference is generated once

The reference represents one logical withdrawal attempt. If the server processes the withdrawal but the response is lost, retrying with the same reference lets the backend recognise the original request. Generating a new reference on retry could make the server treat it as a second withdrawal and move the money twice.

What I personally verified

• Client-side rejection below the minimum.

• A server refusal mapped back to the amount field.

• A successful withdrawal.

• Idempotency-Key present in the Network request.

• Balance refresh after success.

Evidence

• evidence/task-3-validation.png

• evidence/task-3-server-error.png

• evidence/task-3-success.png

• evidence/task-3-network.png

AI usage for Task 3

AI helped with the first pass of the Zod schema, mutation flow, field-level error mapping, and idempotency reasoning. I changed the proposed raw minor-unit input to normal Naira input because it is clearer for a real user, while still keeping the API contract in minor units. I personally verified the request headers, validation, success state, and refreshed balance.

TASK 4

WordPress / PHP Defects

Approach

I treated docs/API-CONTRACT.md as the authority and looked for the four narrow mismatches the brief described. I avoided broad rewrites and fixed each issue minimally, then verified it with real HTTP responses.

Defect 1 — Permission

What it was: GET /me/earnings checked only whether the caller was authenticated, not whether the caller was an instructor.

Why it was wrong: A learner could access an instructor-only endpoint. The contract requires a learner to receive 403.

What I changed: I changed the route permission callback from check_authenticated to check_instructor.

How I proved it: Before the fix the learner received 200. After the fix the learner received 403, while the instructor still received 200.

Defect 2 — Schema mismatch

What it was: The course detail controller read lessons_total, but the schema and seed data use lesson_count.

Why it was wrong: The missing property quietly became null and lessonCount was returned as 0.

What I changed: I changed the controller to read lesson_count.

How I proved it: GET /courses/1 returned lessonCount 0 before the fix and 12 after the fix.

Defect 3 — API contract

What it was: GET /courses did not filter by publication status, so the unpublished Advanced Laminated Dough course was returned.

Why it was wrong: The public contract says unpublished courses must never be returned.

What I changed: I added the published-course condition to the SQL query.

How I proved it: Before the fix the response contained five courses including the unpublished one. After the fix it contained the four published courses only.

Defect 4 — Validation

What it was: The withdrawal endpoint did not enforce the minimum withdrawal amount.

Why it was wrong: A valid-shaped request below the documented minimum could be accepted.

What I changed: I added the minimum check before the balance check and return 422 with below_minimum.

How I proved it: A below-minimum request was accepted before the fix and rejected with 422 after the fix.

Evidence

evidence/task-4-curl.txt contains the before-and-after curl output for all four defects.

AI usage for Task 4

AI helped me compare the controller and schema files against the contract and narrow the likely causes. I kept only the changes that matched the documented four defect categories and personally ran the before-and-after HTTP checks.

TASK 5

Database

5.1 — NULL versus 0

I queried every course and included both the values and explicit NULL checks. Pastry Fundamentals has NULL enrolment_count and NULL average_rating. Cake Decorating Basics has a genuine average_rating of 0.00. Advanced Laminated Dough has a genuine enrolment_count of 0 and a NULL rating.

This matters because NULL means the value is not yet known or measured, while 0 means it was measured and the result was zero. Showing both as 0 would give the user the wrong information.

5.2 — Withdrawal reference constraint

I tested the existing unique key by inserting rows with the same instructor_id and payout_reference while cancelled_at was NULL. MySQL accepted the duplicates, which proved the index did not enforce the intended idempotency rule.

The reason is that cancelled_at is part of the unique key and NULL values are allowed to repeat in this situation. Because active withdrawals naturally have cancelled_at = NULL, the old key could still allow duplicate active payout references.

I created database/migrations/002_fix_withdrawal_reference.sql instead of editing 001_initial.sql because 001 had already been applied. A new forward-only migration updates existing databases without rewriting migration history.

I removed the duplicate test rows before adding the corrected unique index, applied the migration, checked SHOW CREATE TABLE, and reran the duplicate insert. The second insert was rejected after the fix.

5.3 — Join

I used a LEFT JOIN from courses to enrolments, with refunded_at IS NULL in the join condition. That keeps every course in the result even when there is no matching non-refunded enrolment. An INNER JOIN would have removed zero-enrolment courses and failed the requirement.

The final result showed Introduction to Bread Baking with two non-refunded enrolments and 9000 minor units of revenue. The other courses remained in the result with zero counts and zero revenue.

Answer location

answers/task-5.md contains the SQL and terminal output for the queries.

AI usage for Task 5

AI helped me review the NULL-versus-zero query, the unique-index behaviour, the forward migration, and the LEFT JOIN logic. I personally ran the SQL against the assessment database, copied the terminal output, applied the migration, and tested the duplicate insert again.

TASK 6

Infrastructure Incidents

Incident 1 — Invisible deploy

I would start with the cheapest checks. First I would hard refresh or use a private window to rule out browser cache. Then I would confirm that I am on the correct URL and environment. Next I would compare the deployed commit or image version with the commit that contains the fix. If the correct version is running, I would move to CDN, reverse proxy, or static asset caching and compare my response headers and loaded assets with the colleague who says it works.

Incident 2 — 502 after deploy

Because the only change reads a new configuration value, I would check that value first: whether it exists in the deployed environment, whether the key name and case are correct, and whether the value itself is valid. Then I would check application logs inside the running container. A container can be running while the process inside it is unhealthy. Next I would confirm the app is listening on the expected port and call the application directly, bypassing the reverse proxy. If the direct call works, I would focus on the proxy upstream configuration. If it fails too, I would stay with the application or configuration path.

Incident 3 — Vanishing change

The tool was installed inside a running container, so the change only existed in that one container. The next deployment replaced it with a fresh container created from the original image, which is why the tool disappeared. The correct fix is to put the dependency or configuration into source-controlled build files such as the Dockerfile, application dependency file, or environment configuration, then rebuild and redeploy.

Answer location

answers/task-6.md

AI usage for Task 6

AI helped me organise the diagnosis in a cheapest-first order. I kept the answers focused on what I would check, why I would check it, and what each step rules in or out.

TASK 7

Operational Script

What happened before the fix

I ran python3 reconcile_earnings.py payouts.json before changing anything and read the traceback. The script crashed with KeyError: 'fee_minor' because it assumed every record had that key.

What I changed

• I changed the fee handling so a missing or null fee value does not crash the script.

• I made the reconciliation count only rows whose status is paid.

• I added handling for unreadable or invalid JSON files so the script returns the documented exit code 2 instead of a raw traceback.

fee_minor decision

I treated a missing or null fee_minor as zero for this assessment because the supplied operational data still needs to be processed and I did not want to invent a fee that was not recorded. In a production accounting process I would also flag the record for review so that assumption is visible.

What I personally verified

• Successful run against payouts.json.

• Successful process exit code.

• Deliberately missing file case.

• Missing file exits with code 2 after the fix.

Evidence

evidence/task-7-output.txt

AI usage for Task 7

AI helped me interpret the traceback and review the narrow fixes for missing/null fees, status filtering, and documented exit codes. I personally ran the script before and after the changes and checked the final exit code.

Overall AI Disclosure

I used Google Antigravity and ChatGPT during the assessment as coding and review assistants. I did not use AI output as proof that anything worked. I reviewed the suggested approach, kept the parts that matched the supplied contract and project structure, changed or rejected suggestions that did not fit, and then personally verified the result through browser checks, Network requests, curl responses, SQL output, and Python execution.
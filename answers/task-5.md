# Task 5 — Database

> Paste the **terminal output** of every query, not just the SQL. For this task
> the output is the answer.

## 5.1 Investigate — NULL vs 0

```sql
-- your query
## 5.1 Investigate — NULL vs 0

### Query

```sql
SELECT
    id,
    title,
    enrolment_count,
    enrolment_count IS NULL AS enrolment_is_null,
    average_rating,
    average_rating IS NULL AS rating_is_null
FROM wp_bl_courses
ORDER BY id;

```

```
-- output
+----+------------------------------+-----------------+-------------------+----------------+----------------+
| id | title                        | enrolment_count | enrolment_is_null | average_rating | rating_is_null |
+----+------------------------------+-----------------+-------------------+----------------+----------------+
|  1 | Introduction to Bread Baking |             128 |                 0 |           4.60 |              0 |
|  2 | Sourdough Starters           |              64 |                 0 |           4.20 |              0 |
|  3 | Pastry Fundamentals          |            NULL |                 1 |           NULL |              1 |
|  4 | Cake Decorating Basics       |               9 |                 0 |           0.00 |              0 |
|  5 | Advanced Laminated Dough     |               0 |                 0 |           NULL |              1 |
+----+------------------------------+-----------------+-------------------+----------------+----------------+
5 rows in set (0.001 sec)
```

**Which rows are genuinely 0, and which are NULL?**
Pastry Fundamentals
enrolment_count = NULL
average_rating = NULL
This means the values are not yet known / not yet counted.
Cake Decorating Basics
average_rating = 0.00
This is a genuine measured zero rating.
Advanced Laminated Dough
enrolment_count = 0
This is a genuine measured zero enrolment count.
average_rating = NULL

**Why does this matter to a user?** (two sentences)
A NULL value means the metric is not yet known or has not yet been measured, while 0 means the metric was measured and the result was actually zero. Displaying both as 0 would mislead users by making unknown data look like a confirmed zero value.

## 5.2 The constraint

**Proof — two inserts with the same instructor_id and payout_reference:**

```sql
-- your inserts
INSERT INTO wp_bl_withdrawals
    (instructor_id, amount_minor, status, payout_reference, cancelled_at)
VALUES
    (1, 50000, 'pending', 'wd_duplicate_test', NULL);

INSERT INTO wp_bl_withdrawals
    (instructor_id, amount_minor, status, payout_reference, cancelled_at)
VALUES
    (1, 50000, 'pending', 'wd_duplicate_test', NULL);
```

```
-- output
+----+---------------+-------------------+--------------+
| id | instructor_id | payout_reference  | cancelled_at |
+----+---------------+-------------------+--------------+
|  2 |             1 | wd_duplicate_test | NULL         |
|  3 |             1 | wd_duplicate_test | NULL         |
|  4 |             1 | wd_duplicate_test | NULL         |
+----+---------------+-------------------+--------------+
3 rows in set (0.003 sec)
```

**Did the unique key prevent the duplicate? If not, exactly why?**
No. The unique key did not prevent duplicate payout references because cancelled_at is part of the unique index and all of these rows have cancelled_at = NULL. MySQL allows multiple NULL values in a unique index, so rows with the same instructor_id and payout_reference can still coexist when cancelled_at is NULL.
### The fix — `database/migrations/002_fix_withdrawal_reference.sql`
Before applying the new unique index, I removed the duplicate test rows I created because existing duplicates would prevent the corrected unique index from being added.

**Why a new migration rather than editing `001_initial.sql`:** (one line)
001_initial.sql has already been applied, so changing it would rewrite migration history without updating existing databases; a new forward-only migration safely updates the current schema.

**Applying it:**
SHOW CREATE TABLE wp_bl_withdrawals;
+-------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

```
-- output of applying the migration
```

**`SHOW CREATE TABLE wp_bl_withdrawals;` afterwards:**

```
-- output

```MySQL [bemalearn]> INSERT INTO wp_bl_withdrawals
    ->     (instructor_id, amount_minor, status, payout_reference, cancelled_at) 
    -> VALUES
    ->     (1, 50000, 'pending', 'wd_duplicate_test', NULL);
Query OK, 1 row affected (0.003 sec)

MySQL [bemalearn]> 
MySQL [bemalearn]> INSERT INTO wp_bl_withdrawals
    ->     (instructor_id, amount_minor, status, payout_reference, cancelled_at) 
    -> VALUES
    ->     (1, 50000, 'pending', 'wd_duplicate_test', NULL);
ERROR 1062 (23000): Duplicate entry '1-wd_duplicate_test' for key 'wp_bl_withdrawals.uq_reference'

**The duplicate insert, re-run and now rejected:**

```
-- output
```

## 5.3 The join

```sql
-- your query

SELECT
    c.title,
    COUNT(e.id) AS non_refunded_enrolments,
    COALESCE(SUM(e.amount_paid_minor), 0) AS non_refunded_revenue_minor
FROM wp_bl_courses c
LEFT JOIN wp_bl_enrolments e
    ON e.course_id = c.id
   AND e.refunded_at IS NULL
GROUP BY
    c.id,
    c.title
ORDER BY
    c.id;

```

```
-- output

+------------------------------+-------------------------+----------------------------+
| title                        | non_refunded_enrolments | non_refunded_revenue_minor |
+------------------------------+-------------------------+----------------------------+
| Introduction to Bread Baking |                       2 |                       9000 |
| Sourdough Starters           |                       0 |                          0 |
| Pastry Fundamentals          |                       0 |                          0 |
| Cake Decorating Basics       |                       0 |                          0 |
| Advanced Laminated Dough     |                       0 |                          0 |
+------------------------------+-------------------------+----------------------------+
5 rows in set (0.003 sec)
```


**Which join type did you use, and what would break with the other one?**
I used a LEFT JOIN so every course remains in the result even if it has no matching non-refunded enrolments. Using an INNER JOIN would remove courses that have zero matching enrolments, which would violate the requirement that every course must appear.

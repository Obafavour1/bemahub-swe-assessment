#!/usr/bin/env python3
"""
Operational reconciliation script.

Reads a payouts export and reports, per instructor, how much was paid.
Operations runs this after each payout batch to check the provider's file
against what we expected to send.

Usage:
    python3 reconcile_earnings.py payouts.json

Exit codes:
    0  reconciled cleanly
    1  usage error
    2  file could not be read or parsed
    3  discrepancies found
"""

import json
import sys


def load_payouts(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError) as err:
        print(f"Error: could not read or parse file '{path}': {err}", file=sys.stderr)
        sys.exit(2)


def summarise(payouts):
    """Total the payouts per instructor.

    Each record looks like:
        {"instructor_id": 7, "amount_minor": 60000, "status": "paid",
         "fee_minor": 250}

    Only PAID rows count towards the total. A failed or pending payout has not
    moved any money.
    """
    totals = {}

    for row in payouts:
        # Fix 2: Only paid rows count towards the total
        if row.get("status") != "paid":
            continue

        instructor = row["instructor_id"]
        amount = row["amount_minor"]

        # Fix 1: Cope with real-world data where fee_minor is missing or null
        fee = row.get("fee_minor")
        if fee is None:
            fee = 0

        net = amount - fee

        if instructor not in totals:
            totals[instructor] = 0
        totals[instructor] += net

    return totals


def main(argv):
    # Exit 1 for usage error (wrong number of arguments)
    if len(argv) != 2:
        print("usage: reconcile_earnings.py <payouts.json>", file=sys.stderr)
        return 1

    # Fix 3: Exits with 2 if file cannot be read or parsed (handled in load_payouts)
    payouts = load_payouts(argv[1])
    totals = summarise(payouts)

    print("instructor_id,total_net_minor")
    for instructor, total in sorted(totals.items()):
        print(f"{instructor},{total}")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

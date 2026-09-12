import { z } from "zod";
import { formatMoney } from "@/lib/format";

/**
 * Creates a Zod validation schema for the withdrawal form.
 *
 * User UX:
 * 1. Users enter amounts in standard currency (Naira / major units, e.g. 500.00).
 * 2. `minimumWithdrawalMinor` and `availableMinor` are read from the API and converted
 *    to major units for user validation and display.
 * 3. Before sending to the API, the frontend converts the input to minor units:
 *    Math.round(amount * 100).
 */
export function createWithdrawalSchema(
  minimumWithdrawalMinor: number,
  availableMinor: number,
  currency: string = "NGN"
) {
  const minNaira = minimumWithdrawalMinor / 100;
  const maxNaira = availableMinor / 100;
  const formattedMin = formatMoney(minimumWithdrawalMinor, currency);
  const formattedMax = formatMoney(availableMinor, currency);

  return z.object({
    amount: z
      .number({ invalid_type_error: "Please enter a valid withdrawal amount" })
      .positive("Amount must be greater than zero")
      .min(minNaira, `Amount must be at least ${formattedMin}`)
      .max(maxNaira, `Amount cannot exceed your available balance of ${formattedMax}`)
      .refine(
        (val) => {
          // Verify no more than 2 decimal places
          const decimalPart = val.toString().split(".")[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: "Amount cannot have more than 2 decimal places" }
      ),
  });
}

export type WithdrawalFormValues = z.infer<
  ReturnType<typeof createWithdrawalSchema>
>;

import { z } from "zod";
import { BaseBetType } from "../types";

export type TDieRollGameCondition = "OVER" | "UNDER";
export type TDieRollGameTarget = number;

export const DieRollBetType = BaseBetType.extend({
  condition: z.enum(["OVER", "UNDER"]),
  target: z.number().min(1).max(99),
  amount: z.string(), // Changed from number to string for BigInt compatibility
});

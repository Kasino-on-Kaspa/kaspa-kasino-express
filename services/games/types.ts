import { z } from "zod";

export const BaseBetType = z.object({
  client_seed: z.string(),
  amount: z.bigint(),
});

export type AckFunctionParams =
  | { success: true }
  | { success: false; error: string };

export type AckFunction = (
  params: AckFunctionParams
) => void;

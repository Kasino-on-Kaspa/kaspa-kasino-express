import { z } from "zod";

export const BaseBetType = z.object({
  client_seed: z.string(),
  amount: z.string(),
});

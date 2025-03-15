import { z } from "zod";
import { BaseBetType } from "../types";

export const CoinflipBetType = BaseBetType.extend({
  choice: z.enum(["HEADS","TAILS"]),
});
 
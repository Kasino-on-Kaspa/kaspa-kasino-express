import { z } from "zod";
import { BaseBetType } from "../types";

export const DieRollBetType = BaseBetType.extend({
  target: z.number(),
  condition: z.enum(["OVER","UNDER"]),
});

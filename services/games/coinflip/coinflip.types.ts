import { coinflip } from "../../../schema/games/coinflip.schema";

export type TCoinflipPreviousGame = {
  sessionId?: string;
  serverSeed: string;
};

import { SessionStore } from "../../../utils/session/session-store";
import { CoinFlipSessionContext } from "./entities/coinflip.context";
import { CoinFlipSessionStateFactory } from "./entities/coinflip.factory";

export class CoinFlipModel {
    private coinFlipSessionStore = new SessionStore<CoinFlipSessionContext>();

      private stateFactory = new CoinFlipSessionStateFactory();
      
      private coinFlipSessionSeedStore: {
        [socket_id: string]: { serverSeed: string; serverSeedHash: string };
      } = {};
    
}
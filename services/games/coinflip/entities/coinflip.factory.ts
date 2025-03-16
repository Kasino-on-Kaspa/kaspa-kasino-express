import { BetBaseSessionStateFactory } from "../../../../utils/session/entities/session.factory";
import { BetSessionBaseState } from "../../../../utils/session/base.state";
import { CoinFlipSettleState } from "../states/game-settle.state";
import { CoinflipSessionContext } from "./coinflip.context";
import { SessionManager } from "../../../../utils/session/session.manager";

export class CoinFlipFactory extends BetBaseSessionStateFactory {
    public GameSettleState: () => BetSessionBaseState = () => {
        return new CoinFlipSettleState();
    }

  
}

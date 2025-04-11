import { SessionStateFactory } from "@utils/session/session.factory";
import { CoinflipStateManager } from "./state.manager";
import { CoinflipSession } from "./coinflip.session";
import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from "../states";
import { CoinflipStartState,CoinflipCashoutState,CoinflipTimeoutState,CoinflipChoiceState,CoinflipFlipState,CoinflipSettleState,CoinflipEndState,CoinflipNextState } from "../states/";

export class CoinflipStateFactory extends SessionStateFactory<CoinflipStateManager> {
    public GetState(stateName: string): SessionBaseState<CoinflipStateManager> {
        switch (stateName) {
            case CoinflipSessionGameState.START:
                return new CoinflipStartState();
            case CoinflipSessionGameState.CHOICE:
                return new CoinflipChoiceState();
            case CoinflipSessionGameState.FLIP:
                return new CoinflipFlipState();
            case CoinflipSessionGameState.SETTLE:
                return new CoinflipSettleState();
            case CoinflipSessionGameState.CASHOUT:
                return new CoinflipCashoutState();
            case CoinflipSessionGameState.END:
                return new CoinflipEndState();
            case CoinflipSessionGameState.TIMEOUT:
                return new CoinflipTimeoutState();
            case CoinflipSessionGameState.NEXT:
                return new CoinflipNextState();
            default:
                throw new Error(`State ${stateName} not found`);
        }
    }
    
    public CreateStateManager(session: CoinflipSession, state: CoinflipSessionGameState): CoinflipStateManager {
        return new CoinflipStateManager(this, state, session);
    }


}
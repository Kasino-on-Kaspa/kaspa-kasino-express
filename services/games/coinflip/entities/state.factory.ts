import { SessionStateFactory } from "@utils/session/session.factory";
import { CoinflipStateManager } from "./state.manager";
import { CoinflipSession } from "./coinflip.session";
import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from "../state";
import { CoinflipStartState } from "../state/start.state";
import { CoinflipFlipChoiceState } from "../state/flip-choice.state";
import { CoinflipFlipState } from "../state/flip.state";
import { CoinflipSettleState } from "../state/settle.state";
import { CoinflipNextChoiceState } from "../state/next-choice.state";
import { CoinflipCashoutState } from "../state/cashout.state";
import { CoinflipEndState } from "../state/end.state";
import { CoinflipTimeoutState } from "../state/timeout.state";

export class CoinflipStateFactory extends SessionStateFactory<CoinflipStateManager> {
    public GetState(stateName: string): SessionBaseState<CoinflipStateManager> {
        switch (stateName) {
            case CoinflipSessionGameState.START:
                return new CoinflipStartState();
            case CoinflipSessionGameState.FLIP_CHOICE:
                return new CoinflipFlipChoiceState();
            case CoinflipSessionGameState.FLIP:
                return new CoinflipFlipState();
            case CoinflipSessionGameState.SETTLE:
                return new CoinflipSettleState();
            case CoinflipSessionGameState.NEXT_CHOICE:
                return new CoinflipNextChoiceState();
            case CoinflipSessionGameState.CASHOUT:
                return new CoinflipCashoutState();
            case CoinflipSessionGameState.END:
                return new CoinflipEndState();
            case CoinflipSessionGameState.TIMEOUT:
                return new CoinflipTimeoutState();
            default:
                throw new Error(`State ${stateName} not found`);
        }
    }
    
    public CreateStateManager(session: CoinflipSession, state: CoinflipSessionGameState): CoinflipStateManager {
        return new CoinflipStateManager(this, state, session);
    }


}
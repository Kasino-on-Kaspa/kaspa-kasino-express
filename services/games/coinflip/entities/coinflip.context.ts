import { Account } from "../../../../utils/account";
import { ObservableEvent } from "../../../../utils/observables/event";
import { BetSessionContext } from "../../../../utils/session/entities/session.context";

export class CoinflipSessionContext extends BetSessionContext {
  public readonly Level: number;
  public Next?: "CONTINUE" | "PENDING" | "CASHOUT" | "DEFEATED";
  public readonly GameFlipChoiceEvent = new ObservableEvent<"HEADS" | "TAILS">();
  public readonly GameNextChoiceEvent = new ObservableEvent<"CONTINUE" | "CASHOUT">();
  public readonly GameResultEvent = new ObservableEvent<{client_won:boolean,player_choice:"HEADS" | "TAILS",result:"HEADS" | "TAILS"}>();
  
  private _result?: {client_won:boolean,player_choice:"HEADS" | "TAILS",result:"HEADS" | "TAILS"};
  
  public get Result() : typeof this._result {
    return this._result;
  }
  
  public set Result(result: {client_won:boolean,player_choice:"HEADS" | "TAILS",result:"HEADS" | "TAILS"}) {
    this._result = result;
  }
  
  public override get Multiplier(): number {
    return super.Multiplier ** this.Level;
  }

  public ResetContext() {
    this._result = undefined;
    this.Next = undefined;
  }

  constructor(
    id: string,
    sSeed: string,
    sSeedHash: string,
    cSeed: string,
    bet: bigint,
    multiplier: number,
    account: Account,
    level: number
  ) {
    super(id, sSeed, sSeedHash, cSeed, bet, multiplier, account);
    this.Level = level;
  }

}

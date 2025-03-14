import { DB } from "../../../../database";
import { coinflip } from "../../../../schema/games/coinflip.schema";
import { BetSessionBaseState } from "../../../../utils/session/state";
import { BetSessionStateMachine } from "../../../../utils/session/state-machine";
import { CoinFlipSessionContext } from "../entities/coinflip.context";

export class BetSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_SETTLE";

  public EnterState(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ): void {
    manager.SessionContext.OnGameSettled.Raise();
    if (
      manager.SessionContext.CurrentGameLevel >=
      manager.SessionContext.MaxGameLevels
    ) {
      this.HandleClientFullfill(manager, "CASHOUT");
      return;
    }

    manager.SessionContext.OnClientFullfillOptionSelected.RegisterEventListener(
      async (option) => this.HandleClientFullfill(manager, option),
      true
    );
  }

  private async HandleClientFullfill(
    manager: BetSessionStateMachine<CoinFlipSessionContext>,
    option: "CONTINUE" | "CASHOUT"
  ) {

    await DB.insert(coinflip).values({
      multiplier: manager.SessionContext.Multiplier,
      playerChoice: manager.SessionContext.LastGameChoice!,
      sessionId: manager.SessionContext.SessionId,
      status: option,
      level: manager.SessionContext.CurrentGameLevel,
      result: manager.SessionContext.GameResult.GetData()!.resultFlip,
    });

    if (option == "CONTINUE") return this.HandleBetContinue(manager);
    else if (option == "CASHOUT") return this.HandleBetCashout(manager);
  }

  private async HandleBetCashout(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;
    let multiplier = manager.SessionContext.Multiplier;

    const winAmount = (bet_amount * BigInt(multiplier ** manager.SessionContext.CurrentGameLevel)) / BigInt(10000); // Convert to BigInt calculation

    await account.AddBalance(winAmount, "WIN");

    manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());

  }

  private async HandleBetContinue(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    manager.SessionContext.IncrementLevel();
    manager.ChangeCurrentState(manager.SessionStates.GameSettleState());
  }

  public ExitState(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ): void {
    throw new Error("Method not implemented.");
  }
}

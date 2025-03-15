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
    this.HandleBetSettling(manager);
  }

  private async HandleBetSettling(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    let result = manager.SessionContext.GameResult.GetData();
    if (result?.isWon) await this.HandleBetWin(manager);
    else await this.HandleBetDefeat(manager);
  }

  private async HandleBetDefeat(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    manager.SessionContext.CurrentSessionStatus.SetData("DEFEATED");
    this.AddOptionToDB(manager);
    manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());
  }

  private async HandleBetWin(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    manager.SessionContext.CurrentSessionStatus.SetData("PENDING");

    if (
      manager.SessionContext.CurrentGameLevel >=
      manager.SessionContext.MaxGameLevels
    ) {
      return this.HandleCashout(manager);
    }

    manager.SessionContext.CurrentSessionStatus.AddListener(async (option) => {
      option == "CASHOUT"
        ? await this.HandleCashout(manager)
        : await this.HandleContinue(manager);
    }, true);
  }

  private async HandleContinue(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    manager.SessionContext.CurrentSessionStatus.SetData("CONTINUE");
    this.AddOptionToDB(manager);

    manager.SessionContext.IncrementLevel();
    manager.ChangeCurrentState(manager.SessionStates.GetStartState());
  }

  private async HandleCashout(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    manager.SessionContext.CurrentSessionStatus.SetData("CASHOUT");
    this.AddOptionToDB(manager);

    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;
    let multiplier = manager.SessionContext.Multiplier;

    const winAmount =
      (bet_amount *
        BigInt(multiplier ** manager.SessionContext.CurrentGameLevel)) /
      BigInt(10000); // Convert to BigInt calculation

    await account.AddBalance(winAmount, "WIN");

    manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());
  }

  private async AddOptionToDB(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    let result = manager.SessionContext.GameResult.GetData();
    await DB.insert(coinflip).values({
      multiplier: manager.SessionContext.Multiplier,
      playerChoice: manager.SessionContext.LastGameChoice!,
      sessionId: manager.SessionContext.SessionId,
      status: manager.SessionContext.CurrentSessionStatus.GetData(),
      level: manager.SessionContext.CurrentGameLevel,
      result: result!.resultFlip,
      client_won: result!.isWon,
    });
  }

  public ExitState(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ): void {}
}

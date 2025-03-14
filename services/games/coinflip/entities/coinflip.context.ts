import { z } from "zod";
import { BetSessionContext } from "../../../../utils/session/entities/session-context";
import {
  E_COINFLIP_OPTION,
  E_COINFLIP_STATUS,
} from "../../../../schema/games/coinflip.schema";
import { Account } from "../../../../utils/account";
import { ObservableData } from "../../../../utils/observables/data";
import { ObservableEvent } from "../../../../utils/observables/event";

type TCoinFlipOption = (typeof E_COINFLIP_OPTION.enumValues)[number];
type TCoinStatus = (typeof E_COINFLIP_STATUS.enumValues)[number];

const MAX_GAME_LEVELS = 20;

export class CoinFlipSessionContext extends BetSessionContext {
  public readonly GameClientChoice: TCoinFlipOption;

  private currentGameLevel: number;

  public get CurrentGameLevel() {
    return this.currentGameLevel;
  }

  public OnGameSettled: ObservableEvent<void> = new ObservableEvent();
  public OnClientFullfillOptionSelected: ObservableEvent<TCoinStatus> =
    new ObservableEvent();

  public readonly MaxGameLevels = MAX_GAME_LEVELS;

  public readonly GameResult = new ObservableData<
    { resultFlip: TCoinFlipOption; isWon: boolean } | undefined
  >(undefined);

  constructor(
    id: string,
    sSeed: string,
    sSeedHash: string,
    cSeed: string,
    bet: bigint,
    multiplier: number,
    account: Account,
    choice: TCoinFlipOption,
    level: number = 0
  ) {
    super(id, sSeed, sSeedHash, cSeed, bet, multiplier, account);

    this.GameClientChoice = choice;
    this.currentGameLevel = level;
  }

  public SetResult(isWon: boolean, result: TCoinFlipOption) {
    this.GameResult.SetData({ resultFlip: result, isWon });
  }

  public IncrementLevel() {
    this.currentGameLevel++;
  }
}

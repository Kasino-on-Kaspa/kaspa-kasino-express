import { z } from "zod";
import { BetSessionContext } from "../../../../utils/session/context";
import { DieRollBetType } from "../types";
import { ObservableData } from "../../../../utils/observables/data";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.amount>;

export class DieRollSessionContext extends BetSessionContext {
  public readonly GameCondition: TDieRollGameCondition;
  public readonly GameTarget: TDieRollGameTarget;

  public result = new ObservableData<
    { resultRoll: number; isWon: boolean } | undefined
  >(undefined);

  constructor(
    id: string,
    sSeed: string,
    sSeedHash: string,
    cSeed: string,
    condition: TDieRollGameCondition,
    target: TDieRollGameTarget
  ) {
    super(id, sSeed, sSeedHash, cSeed);

    this.GameCondition = condition;
    this.GameTarget = target;
  }

  public SetResult(isWon: boolean, result: number) {
    this.result.SetData({ resultRoll: result, isWon });
  }
}

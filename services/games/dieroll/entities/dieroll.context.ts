import { z } from "zod";
import { BetSessionContext } from "../../../../utils/session/entities/session-context";
import { DieRollBetType } from "../types";
import { ObservableData } from "../../../../utils/observables/data";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.amount>;

export class DieRollSessionContext extends BetSessionContext {
	public readonly GameCondition: TDieRollGameCondition;
	public readonly GameTarget: TDieRollGameTarget;
	public readonly GameMultiplier: number;

	public readonly Result = new ObservableData<
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

		this.GameMultiplier = this.CalculateMultiplier(condition, target);
	}

	public SetResult(isWon: boolean, result: number) {
		this.Result.SetData({ resultRoll: result, isWon });
	}

  public CalculateMultiplier(
    condition: "OVER" | "UNDER",
    target: number,
    houseEdge: number = 2
  ): number {
    // Validate inputs
    if (target < 1 || target > 99) {
      throw new Error("Target must be between 1 and 99");
    }
    if (houseEdge < 0 || houseEdge > 100) {
      throw new Error("House edge must be between 0 and 100");
    }

    // Calculate win probability
    const winProbability =
      condition === "OVER"
        ? (100 - target) / 100 // Probability of rolling > target
        : target / 100; // Probability of rolling ≤ target

    // Calculate fair multiplier (without house edge)
    const fairMultiplier = 1 / winProbability;

    // Apply house edge
    const multiplierWithEdge = fairMultiplier * (1 - houseEdge / 100);

    // Convert to basis points (1/10000)
    return Math.round(multiplierWithEdge * 10000);
	}
}

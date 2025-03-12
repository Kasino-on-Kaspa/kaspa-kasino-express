import { z } from "zod";
import { BetSessionContext } from "../../../../utils/session/entities/session-context";
import { DieRollBetType } from "../types";
import { ObservableData } from "../../../../utils/observables/data";
import { Account } from "../../../../utils/account";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.amount>;

export class DieRollSessionContext extends BetSessionContext {
	public readonly GameCondition: TDieRollGameCondition;
	public readonly GameTarget: TDieRollGameTarget;

	public readonly Result = new ObservableData<
		{ resultRoll: number; isWon: boolean } | undefined
	>(undefined);

	constructor(
		id: string,
		sSeed: string,
		sSeedHash: string,
		cSeed: string,
    account:Account,
		condition: TDieRollGameCondition,
		target: TDieRollGameTarget,
    multiplier:number,
    bet:number
	) {
		super(id, sSeed, sSeedHash, cSeed,bet,multiplier,account);
    
    this.GameCondition = condition;
		this.GameTarget = target;
    
	}

	public SetResult(isWon: boolean, result: number) {
		this.Result.SetData({ resultRoll: result, isWon });
	}

}

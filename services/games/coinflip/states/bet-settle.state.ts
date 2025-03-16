import { DB } from "../../../../database";
import { coinflip } from "../../../../schema/games/coinflip.schema";
import { BetSessionBaseState } from "../../../../utils/session/base.state";
import { SessionManager } from "../../../../utils/session/session.manager";
import { CoinflipSessionContext } from "../entities/coinflip.context";

export class BetSettleState extends BetSessionBaseState {
    protected _stateName: TSessionState = "BET_SETTLE";
    private nextChoiceListenerIndex?: number;
    
    public EnterState(manager: SessionManager<CoinflipSessionContext>): void {
        const result = manager.SessionContext.Result!;
        if (!result.client_won) {
            this.HandleDefeat(manager);
            return;
        } 
        manager.SessionContext.Next = "PENDING";        
        manager.OnAssociatedAccountDisconnect.RegisterEventListener(async () => {
            this.HandleAccountDisconnect(manager);
        });
        this.nextChoiceListenerIndex = manager.SessionContext.GameNextChoiceEvent.RegisterEventListener(async (choice) => {
            if (choice === "CONTINUE") {
                this.HandleContinue(manager);
            } else {
                this.HandleCashout(manager);
            }
        });
    }

    private async HandleDefeat(manager: SessionManager<CoinflipSessionContext>) {
        manager.SessionContext.Next = "DEFEATED";
        this.InsertBetToDB(manager,"DEFEATED");
        manager.ChangeCurrentState(manager.SessionStateFactory.BetFullfilledState());
        
    }

    private async HandleContinue(manager: SessionManager<CoinflipSessionContext>) {
        manager.SessionContext.Next = "CONTINUE";
        manager.SessionContext.ResetContext();
        manager.ChangeCurrentState(manager.SessionStateFactory.GameSettleState());
    }

    private async HandleCashout(manager: SessionManager<CoinflipSessionContext>) {
        manager.SessionContext.Next = "CASHOUT";
        let account = manager.SessionContext.ClientAccount;
        let bet_amount = manager.SessionContext.BetAmount;
        let multiplier = manager.SessionContext.Multiplier;

        const winAmount = (bet_amount * BigInt(multiplier)) / BigInt(10000);

        await account.AddBalance(winAmount, "WIN");
        manager.ChangeCurrentState(manager.SessionStateFactory.BetFullfilledState());
        
    }

    private async InsertBetToDB(manager: SessionManager<CoinflipSessionContext>,status:"CONTINUE" | "CASHOUT" | "PENDING" | "DEFEATED") {
        let data: typeof coinflip.$inferInsert = {
            sessionId: manager.SessionContext.SessionId,
            playerChoice: manager.SessionContext.Result!.player_choice,
            result: manager.SessionContext.Result!.result,
            client_won: manager.SessionContext.Result!.client_won,
            level: manager.SessionContext.Level,
            multiplier: manager.SessionContext.Multiplier,
            next: status
        }
        return await DB.insert(coinflip).values(data).returning();
    }

    public ExitState(manager: SessionManager<CoinflipSessionContext>): void {
        if (!this.nextChoiceListenerIndex) return;
        manager.SessionContext.GameNextChoiceEvent.UnRegisterEventListener(this.nextChoiceListenerIndex);
    }

    private async HandleAccountDisconnect(manager: SessionManager<CoinflipSessionContext>) {
        manager.SessionContext.Next = "PENDING";
        this.InsertBetToDB(manager,"PENDING");
        if (!this.nextChoiceListenerIndex) return;
        manager.SessionContext.GameNextChoiceEvent.UnRegisterEventListener(this.nextChoiceListenerIndex);
    }
}

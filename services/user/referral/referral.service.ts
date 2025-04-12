import { Server } from "socket.io";
import { Express } from "express";
import { Service } from "@utils/service/service";
import { EventBus } from "@utils/eventbus";
import { ReferralController } from "./referral.controller";

class ReferralService extends Service {
  private controller: ReferralController = new ReferralController();
  
  public override ServerEventsHandler(): void {
    EventBus.Instance.on(
      "game:completed",
      (data: {
        account: { username: string; id: string };
        result: "WIN" | "LOSE" | "DRAW";
        bet: number;
        payout: number;
      }) => {
        this.controller.handleGameCompleted(data);
      }
    );
  }
}

export function InstantiateReferralService(io: Server, server: Express) {
  return new ReferralService(io, server);
}

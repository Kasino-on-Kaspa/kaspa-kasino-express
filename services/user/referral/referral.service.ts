import { Server } from "socket.io";
import { Express, Request, Response, RequestHandler } from "express";
import { Service } from "@utils/service/service";
import { EventBus } from "@utils/eventbus";
import { ReferralController } from "./referral.controller";

class ReferralService extends Service {
  private controller: ReferralController = new ReferralController();

  constructor(io: Server, express: Express) {
    super(io, express);
    this.controller = new ReferralController();
    this.expressHandler(express);
  }

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

  public expressHandler(server: Express): void {
    const statsHandler: RequestHandler = async (req, res, next) => {
      const { referralCode } = req.query;

      if (!referralCode || typeof referralCode !== "string") {
        res.status(400).json({ error: "Referral code is required" });
        return;
      }

      try {
        const stats = await this.controller.getReferralStats(referralCode);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching referral stats:", error);
        res.status(500).json({ error: "Failed to fetch referral stats" });
      }
    };

    server.get("/api/referral/stats", statsHandler);
  }
}

export function InstantiateReferralService(io: Server, server: Express) {
  return new ReferralService(io, server);
}

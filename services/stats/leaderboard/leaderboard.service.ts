import { Server, Socket } from "socket.io";
import { Service } from "@utils/service/service";
import { LeaderboardController } from "./leaderboard.controller";
import { Express } from "express";
import { EventBus } from "@utils/eventbus";

export class LeaderboardService extends Service {
  private readonly LeaderboardController;

  constructor(io: Server, express: Express){
    super(io, express);
    this.LeaderboardController = new LeaderboardController();
    this.HandleInitializeRoutes(express);
  }

  public override InitializeRoutes(): void {
    this.router.get("/leaderboard", this.LeaderboardController.getLeaderboard);
  }

  public override ServerEventsHandler(): void {
    EventBus.Instance.on("stats:updated", () => {
      this.LeaderboardController.refreshLeaderboard();
    });
    
  }
}

export function InitializeLeaderboardService(io: Server, express: Express) {
  const leaderboardService = new LeaderboardService(io, express);
  return leaderboardService;
}

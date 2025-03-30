import { Server, Socket } from "socket.io";
import { Service } from "@utils/service/service";
import { LeaderboardController } from "./leaderboard.controller";
import { Express } from "express";

export class LeaderboardService extends Service {
  private readonly LeaderboardController = new LeaderboardController();

  public override InitializeRoutes(): void {
    this.router.get("/leaderboard", this.LeaderboardController.getLeaderboard);
  }

  public override ServerEventsHandler(): void {
    this.server.on("stats:updated", () => {
      this.LeaderboardController.refreshLeaderboard();
    });
    
  }
}

export function InitializeLeaderboardService(io: Server, express: Express) {
  const leaderboardService = new LeaderboardService(io, express);
  return leaderboardService;
}

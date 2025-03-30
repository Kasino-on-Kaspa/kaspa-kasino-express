import { Server, Socket } from "socket.io";
import { Express } from "express";
import { LeaderboardController } from "./leaderboard.controller";
import { Service } from "@utils/service/service";

class LeaderboardService extends Service {
    private readonly controller: LeaderboardController = new LeaderboardController();

    public override InitializeRoutes(express: Express) {
        
    }
}

export function InitializeLeaderboardService(io: Server, express: Express) {
    new LeaderboardService(io, express);
}
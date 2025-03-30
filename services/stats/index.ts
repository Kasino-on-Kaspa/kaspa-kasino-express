import { Server } from "socket.io";
import { Express } from "express";
import { InitializeGameLogService } from "./game-log/game-log.service";
import { InitializeLeaderboardService } from "./leaderboard/leaderboard.service";
export function InitializeStatsService(io: Server, express: Express) {
    InitializeGameLogService(io, express);
    InitializeLeaderboardService(io, express);
}
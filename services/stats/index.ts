import { Server } from "socket.io";
import { Express } from "express";
import { InitializeLeaderboardService } from "./leaderboard/leaderboard.service";
export function InitializeStatsService(io: Server, express: Express) {
    InitializeLeaderboardService(io, express);
}
import { Server } from "socket.io";
import { Express } from "express";
import { InitializeGameLogService } from "./game-log/game-log.service";

export function InitializeStatsService(io: Server, express: Express) {
    InitializeGameLogService(io, express);
}
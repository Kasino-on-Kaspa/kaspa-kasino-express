import { Server } from "socket.io";
import { InitializeGameServices } from "./games";
import { InitializeWalletServices } from "./wallet";
import { Express } from "express";
import { InitializeStatsService } from "./stats";

export function AuthorizedServices(io: Server, express: Express) {
  InitializeGameServices(io, express);
  InitializeWalletServices(io, express);
}

export function UnauthorizedServices(io: Server, express: Express) {
  InitializeStatsService(io, express);
}
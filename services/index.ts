import { Server } from "socket.io";
import { InitializeGameServices } from "./games";
import { InitializeWalletServices } from "./wallet";
import { Express } from "express";

export function InstantiateServices(io: Server, express: Express) {
  InitializeGameServices(io, express);
  InitializeWalletServices(io, express);
}

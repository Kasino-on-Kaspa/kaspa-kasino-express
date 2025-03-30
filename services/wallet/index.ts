import { Server } from "socket.io";
import { InitializeWalletSocketService } from "./wallet.service";
import { Express } from "express";

export function InitializeWalletServices(io: Server, express: Express){
    InitializeWalletSocketService(io, express);
}
import { Server } from "socket.io";
import { InitializeWalletSocketService } from "./wallet.service";

export function InitializeWalletServices(io: Server){
    InitializeWalletSocketService(io);
}
import { Server } from "socket.io";
import { InitializeWalletSocketService } from "./wallet.socket";

export function InitializeWalletServices(io: Server){
    InitializeWalletSocketService(io);
}
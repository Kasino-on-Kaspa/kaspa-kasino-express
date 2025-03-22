import { Server } from "socket.io";
import { InitializeGameServices } from "./games";
import { InitializeWalletService } from "./wallet/wallet.socket";

export function InstantiateServices(io: Server) {
    InitializeWalletService(io);
	InitializeGameServices(io);
}
import { Server } from "socket.io";
import { InitializeGameServices } from "./games";
import { InitializeWalletServices } from "./wallet";

export function InstantiateServices(io: Server) {
  InitializeGameServices(io);
  InitializeWalletServices(io);
}

import { Server } from "socket.io";
import { InitializeGameServices } from "./games";

export function InstantiateServices(io: Server) {
  InitializeGameServices(io);
}

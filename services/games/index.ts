import { Server } from "socket.io";
import { InitializeCointFlip } from "./coinflip/coinflip.service";
import { InitializeDierollService } from "./dieroll/dieroll.service";

export function InitializeGameServices(io: Server) {
	InitializeCointFlip(io);
	InitializeDierollService(io);
}

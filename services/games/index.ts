import { Server } from "socket.io";
import { Express } from "express";
import { InitializeCointFlip } from "./coinflip/coinflip.service";
import { InitializeDierollService } from "./dieroll/dieroll.service";

export function InitializeGameServices(io: Server, express: Express) {
	InitializeCointFlip(io, express);
	InitializeDierollService(io, express);
}

import { InstantiateReferralService } from "./referral/referral.service";
import { Server } from "socket.io";
import { Express } from "express";

export function InitializeUserServices(io: Server, server: Express) {
  InstantiateReferralService(io, server);
}

import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { Socket } from "socket.io";

export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    publicKey: string;
    nonce: string;
    expiry: number;
  };
}

export const authenticateJWT = (
  socket: Socket,
  next: NextFunction
): void => {
  const authHeader = socket.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = authService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  // Check if token is expired based on the expiry claim
  if (payload.exp && payload.exp < Date.now() / 1000) {
    res.status(401).json({ message: "Token has expired" });
    return;
  }

  req.user = {
    address: payload.address,
    publicKey: payload.publicKey,
    nonce: payload.nonce,
    expiry: payload.expiry,
  };

  next();
};

export const authMiddleware = authenticateJWT;

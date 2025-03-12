import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { authService } from "./auth.service";
import { userService } from "../user/user.service";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    address: string;
    xOnlyPublicKey: string;
    wallet: string;
    balance: number;
    username: string | null;
  };
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError | undefined) => void
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    // Remove 'Bearer ' if present
    const cleanToken = token.replace("Bearer ", "");
    const payload = authService.verifyToken(cleanToken);

    if (!payload) {
      return next(new Error("Invalid token"));
    }

    // Check if token is expired based on the expiry claim
    if (payload.expiry < Date.now() / 1000) {
      return next(new Error("Token has expired"));
    }

    // Get user data
    const user = await userService.getUser(payload.address);
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user data to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};

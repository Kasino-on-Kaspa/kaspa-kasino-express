import { Request, Response } from "express";
import { authService, AuthRequest } from "./auth.service";

export class AuthController {
  signIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const authData: AuthRequest = req.body;

      // Verify the Kaspa signature
      const isValid = await authService.verifyKaspaSignature(authData);
      console.log("isValid", isValid);
      if (!isValid) {
        res.status(401).json({ message: "Invalid signature" });
        return;
      }

      // Check if the message has expired
      if (authData.expiry < Date.now() / 1000) {
        res.status(401).json({ message: "Authentication request has expired" });
        return;
      }

      // Generate token pair
      const tokens = authService.generateTokenPair({
        address: authData.address,
        publicKey: authData.publicKey,
        nonce: authData.nonce,
        expiry: authData.expiry,
      });

      res.json({
        ...tokens,
        user: {
          address: authData.address,
          publicKey: authData.publicKey,
        },
      });
    } catch (error) {
      console.error("Sign-in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: "Refresh token is required" });
        return;
      }

      const accessToken = authService.refreshAccessToken(refreshToken);
      if (!accessToken) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      res.json({ accessToken });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export const authController = new AuthController();

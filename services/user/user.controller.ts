import { Request, Response } from "express";
import { userService } from "./user.service";
import { UpdateUserDto } from "./user.types";
import { AuthenticatedRequest } from "../auth/auth.middleware";

export class UserController {
  private serializeUser(user: any) {
    return {
      ...user,
      balance: Number(user.balance),
    };
  }

  getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const address = req.user?.address;
      if (!address) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await userService.getUser(address);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Convert any BigInt values to strings before sending the response
      const serializedUser = JSON.parse(
        JSON.stringify(user, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.json(serializedUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateUser = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const address = req.user?.address;
      if (!address) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { username, referredBy } = req.body;

      // Validate username
      if (username && !this.isValidUsername(username)) {
        res.status(400).json({ message: "Invalid username format" });
        return;
      }

      const updatedUser = await userService.updateUser(address, {
        username,
        referredBy,
      });
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Convert any BigInt values to strings before sending the response
      const serializedUser = JSON.parse(
        JSON.stringify(updatedUser, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.json(serializedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteUser = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const address = req.user?.address;
      if (!address) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const deleted = await userService.deleteUser(address);
      if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  private isValidUsername(username: string): boolean {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }
}

export const userController = new UserController();

import { Request, Response } from "express";
import { userService } from "./user.service";
import { UpdateUserDto } from "./user.types";
import { AuthenticatedRequest } from "../auth/auth.middleware";

export class UserController {
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

      res.json(user);
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

      const { username } = req.body;

      // If username is undefined or null, return bad request
      if (username === undefined) {
        res.status(400).json({ message: "Username is required" });
        return;
      }

      // Validate username
      if (username && !this.isValidUsername(username)) {
        res.status(400).json({ message: "Invalid username format" });
        return;
      }

      const updatedUser = await userService.updateUser(address, { username });
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json(updatedUser);
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

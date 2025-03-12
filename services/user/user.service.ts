import { randomUUID } from "crypto";
import { User } from "./user.types";

// In-memory store for now - replace with your database
const users = new Map<string, User>();

export class UserService {
  async getUser(address: string): Promise<User | null> {
    const user = users.get(address);
    return user || null;
  }

  async updateUser(
    address: string,
    updates: { username: string | null }
  ): Promise<User | null> {
    const user = users.get(address);
    if (!user) return null;

    const updatedUser = {
      ...user,
      username: updates.username,
    };

    users.set(address, updatedUser);
    return updatedUser;
  }

  async deleteUser(address: string): Promise<boolean> {
    if (!users.has(address)) return false;
    return users.delete(address);
  }

  // Internal method used by auth service
  async createUser(
    address: string,
    xOnlyPublicKey: string,
    walletId: string
  ): Promise<User> {
    const user: User = {
      id: randomUUID(),
      address,
      xOnlyPublicKey,
      wallet: walletId,
      createdAt: new Date(),
      balance: 0,
      username: null,
    };

    users.set(address, user);
    return user;
  }
}

export const userService = new UserService();

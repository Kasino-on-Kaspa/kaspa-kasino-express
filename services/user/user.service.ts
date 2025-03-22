import { randomUUID } from "crypto";
import { User } from "./user.types";
import { DB } from "../../database";
import { eq } from "drizzle-orm";
import { users } from "../../schema/users.schema";

// In-memory store for now - replace with your database

export class UserService {
  async getUser(address: string): Promise<User | null> {
    const user = await DB.select()
      .from(users)
      .where(eq(users.address, address));
    return (user[0] as User) || null;
  }

  async updateUser(
    address: string,
    updates: { username: string | null; referredBy: string | null }
  ): Promise<{ username: string | null; referredBy: string | null } | null> {
    console.log("address", address, updates);
    const user = await DB.select()
      .from(users)
      .where(eq(users.address, address));
    if (!user) return null;

    const updatedUser = {
      ...user,
      username: updates.username,
      referredBy: updates.referredBy,
    };

    await DB.update(users).set(updatedUser).where(eq(users.address, address));
    return updatedUser;
  }

  async deleteUser(address: string): Promise<User | null> {
    const result = await DB.delete(users)
      .where(eq(users.address, address))
      .returning();
    return (result[0] as User) || null;
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
      balance: 0n,
      username: null,
    };

    await DB.insert(users).values(user);
    return user;
  }

  async getUserByReferrelCode(referrelCode: string): Promise<User | null> {
    const user = await DB.select()
      .from(users)
      .where(eq(users.referrelCode, referrelCode));
    return (user[0] as User) || null;
  }
}

export const userService = new UserService();

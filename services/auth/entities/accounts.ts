import { eq } from "drizzle-orm";
import { DB } from "../../../database";
import { users } from "../../../schema/users.schema";
import { Account } from "../../../utils/account";

export class AccountStore {
  private _userHandshake: { [socket_id: string]: string } = {};
  private _userAccounts: { [account_id: string]: Account } = {};

  public async AddUserHandshake(socket_id: string, account_id: string) {
    this._userHandshake[socket_id] = account_id;
    
    // Store account by account_id, not socket_id
    if (!this._userAccounts[account_id]) {
      let result = await DB.select()
        .from(users)
        .where(eq(users.id, account_id))
        .limit(1);
      
      if (result.length > 0) {
        this._userAccounts[account_id] = new Account(result[0]);
      } else {
        console.error(`No user found with ID: ${account_id}`);
      }
    }
  }

  public RemoveUserHandshake(socket_id: string) {
    delete this._userHandshake[socket_id];
  }

  public GetUserHandshake(socket_id: string) {
    return this._userHandshake[socket_id];
  }

  public GetUserFromHandshake(socket_id: string) {
    return this._userAccounts[this._userHandshake[socket_id]];
  }

  public UpdateDatabaseForSocket(socket_id: string) {
    // will implement
  }

  public UpdateDatabase(socket_id: string) {
    // will implement
  }

  // Secure method to update balance that requires blockchain verification
  public async UpdateBalanceFromBlockchain(socketId: string, newBalance: number) {
    const account = this._userAccounts[socketId];
    if (account) {
      await account.AddBalance(newBalance);
    }
  }

  // Add this method to get all accounts
  public GetAllAccounts(): Record<string, Account> {
    return this._userAccounts;
  }
}

import { eq } from "drizzle-orm";
import { DB } from "../../../database";
import { users } from "../../../schema/users.schema";
import { Account } from "../../../utils/account";
import { Socket, Server } from "socket.io";
import { EventBus } from "@utils/eventbus";

const MIN_UPDATE_DELAY = 10000;

export class AccountStore {
  
  private _userHandshake: { [socket_id: string]: string } = {};
  private _userAccounts: { [account_id: string]: Account } = {};
  
  private readonly io: Server;
  
  public async AddUserHandshake(socket: Socket, account_id: string) {
    this._userHandshake[socket.id] = account_id;
    
    // Store account by account_id, not socket_id
    let account = this._userAccounts[account_id];

    if (!account) {
      account = await this.GetAccountFromDB(account_id);
    }
    account.AssociatedSockets.AddSockets(socket);
  }

  public GetAllUsers(){
    return this._userHandshake 
  }

  constructor(io: Server) {
    this.io = io;
  }

  private async GetAccountFromDB(account_id: string) {
    let result = await DB.select()
      .from(users)
      .where(eq(users.id, account_id))
      .limit(1);
      
    let account = await Account.InitAccount(result[0], this.io, this);
    this._userAccounts[account_id] = account;

    account.AssociatedSockets.OnAllSocketsDisconnect.RegisterEventListener(async () => {
      this.RemoveUserStoredInstance(account_id);
    });
    
    return account;
  }

  
  private RemoveUserStoredInstance(account_id: string) {
    if (!this._userAccounts[account_id]) {
      return;
    }
    this._userAccounts[account_id].IsDeleted = true;
    delete this._userAccounts[account_id];
  }

 

  //#region Getters
  public GetUserHandshake(socket_id: string) {
    return this._userHandshake[socket_id];
  }

  public GetUserFromHandshake(socket_id: string) {
    return this._userAccounts[this._userHandshake[socket_id]];
  }

  public GetUserFromAccountID(account_id: string) {
    return this._userAccounts[account_id];
  }
  public async GetAccountByReferralID(code: string) {
    let result = await DB.select({id: users.id}).from(users).where(eq(users.referralCode, code))
    return result[0].id
  }
  //#endregion
}

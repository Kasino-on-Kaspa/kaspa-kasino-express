import { eq } from "drizzle-orm";
import { DB } from "../../../database";
import { users } from "../../../schema/users.schema";
import { Account } from "../../../utils/account";
import { E_BALANCE_LOG_TYPE } from "../../../schema/balance.schema";

const MinUpdateDelay = 10000;

export class AccountStore {
	private _userHandshake: { [socket_id: string]: string } = {};
	private _userAccounts: { [account_id: string]: Account } = {};

	private updater?: NodeJS.Timeout;

	public async AddUserHandshake(socket_id: string, account_id: string) {
		this._userHandshake[socket_id] = account_id;

		// Store account by account_id, not socket_id
		let account = this._userAccounts[account_id];

		if (!account) {
			let result = await DB.select()
				.from(users)
				.where(eq(users.id, account_id))
				.limit(1);

			account = new Account(result[0]);
			this._userAccounts[account_id] = account;
		}
		account.AddSockets(socket_id);
	}

	public InstantiateDatabaseTimer(interval: number) {
		this.updater = setInterval(async () => {
			await this.UpdateDatabase();
		}, interval);
	}

	public DestroyDatabaseTimer() {
		if (!this.updater) return;

		clearInterval(this.updater);
		this.updater = undefined;
	}

	public async RemoveUserHandshake(socket_id: string) {
		let account = this._userAccounts[this._userHandshake[socket_id]];
		account.RemoveSocket(socket_id);

		if (account.AssociatedSockets.length <= 0)
			this.UpdateDatabaseForAccount(account);

		delete this._userHandshake[socket_id];
	}

	public GetUserHandshake(socket_id: string) {
		return this._userHandshake[socket_id];
	}

	public GetUserFromHandshake(socket_id: string) {
		return this._userAccounts[this._userHandshake[socket_id]];
	}
  
	public GetUserFromAccountID(account_id: string) {
		return this._userAccounts[account_id]
	}

	public async UpdateDatabaseForAccount(account: Account) {
		await account.UpdateAccountDB();
	}

	private async UpdateDatabase() {
		for (let account of Object.values(this._userAccounts)) {
			account.UpdateAccountDB();
		}
	}
}

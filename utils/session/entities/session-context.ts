import { Account } from "../../account";

export abstract class BetSessionContext {
  public readonly SessionId: string;
  public readonly ServerSeed: string;
  public readonly ServerSeedHash: string;
  public readonly ClientSeed: string;
  public readonly ClientAccount: Account;

  public BetAmount: bigint;
  public Multiplier: number;

  constructor(
    id: string,
    sSeed: string,
    sSeedHash: string,
    cSeed: string,
    bet: bigint,
    multiplier: number,
    account: Account
  ) {
    this.SessionId = id;
    this.ServerSeed = sSeed;
    this.ServerSeedHash = sSeedHash;
    this.ClientSeed = cSeed;
    this.ClientAccount = account;
    this.BetAmount = bet;
    this.Multiplier = multiplier;
  }
}

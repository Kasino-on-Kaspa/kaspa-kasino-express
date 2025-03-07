export abstract class BetSessionContext {
  private sessionId: string;
  private serverSeed: string;
  private serverSeedHash: string;
  private clientSeed: string;

  public get SessionID() {
    return this.sessionId;
  }

  public get ServerSeed() {
    return this.serverSeed;
  }
  public get ServerSeedHash() {
    return this.serverSeedHash;
  }

  constructor(id: string, sSeed: string, sSeedHash: string, cSeed: string) {
    this.sessionId = id;
    this.serverSeed = sSeed;
    this.serverSeedHash = sSeedHash;
    this.clientSeed = cSeed;
  }
}

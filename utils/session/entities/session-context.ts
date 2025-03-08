export abstract class BetSessionContext {
	public readonly SessionId: string;
	public readonly ServerSeed: string;
	public readonly ServerSeedHash: string;
	public readonly ClientSeed: string;

	constructor(id: string, sSeed: string, sSeedHash: string, cSeed: string) {
		this.SessionId = id;
		this.ServerSeed = sSeed;
		this.ServerSeedHash = sSeedHash;
		this.ClientSeed = cSeed;
	}
}

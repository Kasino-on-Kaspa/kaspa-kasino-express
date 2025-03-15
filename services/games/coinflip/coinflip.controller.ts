import { Socket } from "socket.io";
import { CoinFlipModel } from "./coinflip.model";
import crypto from "node:crypto";
import { SessionManager } from "../../../utils/session/session.manager";
import { TCoinflipPreviousGame } from "./coinflip.types";
import { AccountStoreInstance } from "../../..";


type THandleGenerateReturn = Promise<{
  serverSeedHash: string;
  sessionId?: string;
}>;

export class CoinFlipController {
  private model = new CoinFlipModel();

  public async HandleNewSession(
    socket: Socket,
    callback: (session: TCoinflipPreviousGame) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let data = await this.model.GetSessionFromAccountId(account.Id);
    if (!data) {
      let seeds = this.GenerateServerSeed();

      this.model.coinflipSessionSeedStore[account.Id] = seeds;

      data = { serverSeed: seeds.serverSeedHash };
    }
    callback(data);
  }

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      serverSeed: sSeed,
      serverSeedHash: sSeedHash,
    };
  }
}

import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinFlipModel } from "./coinflip.model";

import crypto from "node:crypto";
import { z } from "zod";
import { CoinflipBetType } from "./type";
import { AccountStoreInstance } from "../../..";
import {
  COINFLIP_ERROR,
  COINFLIP_FULLFILLED,
  COINFLIP_RESULT,
} from "./coinflip.messages";

type PrvsGame = {
  id: string;
  session: {
    id: string;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    amount: bigint;
    user: string;
    gameType: "DICEROLL" | "COINFLIP";
    createdAt: Date;
  };

  result: "HEADS" | "TAILS";
  level: number;
  multiplier: number;
  account: string;
};

class CoinFlipService extends Service {
  protected serviceName: string = "Coinflip";

  protected Model: CoinFlipModel = new CoinFlipModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on(
      "coinflip:get_previousGames",
      async (
        cb: (prvsGame: PrvsGame[], currentGame?: PrvsGame) => Promise<void>
      ) => {
        let result = await this.HandleGetPreviousGames(socket.id);

        cb(result.result, result.latest);
      }
    );

    socket.on(
      "coinflip:new",
      (cb: (serverSeedHash: string) => Promise<void>) => {
        let result = this.HandleGetServerSeed(socket.id);

        cb(result.sSeedHash);
      }
    );

    socket.on("coinflip:bet", (bet_data: z.infer<typeof CoinflipBetType>) => {
      this.HandleBetCreate(io, socket, bet_data);
    });
  }

  private HandleGetPreviousGames(id: string) {
    let { Id: account_id } = AccountStoreInstance.GetUserFromHandshake(id);
    let results = this.Model.GetPendingPreviousSession(account_id);
    return results;
  }

  private async HandleBetCreate(
    io: Server,
    socket: Socket,
    bet_data: z.infer<typeof CoinflipBetType>
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    let parse = this.ParseParams(bet_data, CoinflipBetType, socket);

    if (!parse.success)
      return socket.emit(COINFLIP_ERROR, {
        message: `Failed to parse arguments`,
        error: parse.error.issues,
      });

    const betAmount = BigInt(parse.data.amount);

    if (account.Balance.GetData() < betAmount) {
      socket.emit(COINFLIP_ERROR, {
        message: "Insufficient Balance",
      });
      return;
    }
    let { session_id } = await this.Model.AddSession(
      socket.id,
      parse.data.client_seed,
      betAmount,
      this.CalculateMultiplier()
    );

    let session = this.Model.GetSession(session_id);

    let resultListner = session.SessionContext.GameResult.AddListener(
      async (new_result) => {
        socket.emit(COINFLIP_RESULT, new_result);
      }
    );

    let responseListener =
      session.SessionContext.CurrentSessionStatus.AddListener(
        async (status) => {
          if (status != "PENDING") return;
          socket.once("coinflip:next", (option: "CASHOUT" | "CONTINUE") => {
            session.SessionContext.CurrentSessionStatus.SetData(option);
          });
        }
      );

    let fullfilledListener = session.AddOnCompleteListener(async () => {
      socket.emit(COINFLIP_FULLFILLED, {
        server_seed: session.SessionContext.ServerSeed,
        server_hash: session.SessionContext.ServerSeedHash,
      });
    });

    account.OnAllSocketsDisconnect.RegisterEventListener(async () => {
      this.Model.OnSessionAccountDisconnected(session_id);
    });

    socket.once("disconnect", () => {
      session.SessionContext.GameResult.RemoveListener(resultListner);
      session.RemoveOnCompleteListener(fullfilledListener);
      session.SessionContext.CurrentSessionStatus.RemoveListener(
        responseListener
      );
    });
  }

  private CalculateMultiplier(): number {
    return 1.96 * 10000;
  }

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      sSeed,
      sSeedHash,
    };
  }

  public HandleGetServerSeed(socket_id: string) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket_id);

    let data = this.GenerateServerSeed();

    this.Model.AddNewSocketServerSeed(account.Id, data.sSeed, data.sSeedHash);
    return { ...data };
  }
}

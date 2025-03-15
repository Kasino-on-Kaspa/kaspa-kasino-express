import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinFlipModel } from "./coinflip.model";

import crypto from "node:crypto";
import { z } from "zod";
import { CoinflipBetType } from "./type";
import { AccountStoreInstance } from "../../..";
import {
  COINFLIP_CASHOUT,
  COINFLIP_CHOICE,
  COINFLIP_CONTINUE,
  COINFLIP_ERROR,
} from "./coinflip.messages";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";
import { CoinFlipSessionContext } from "./entities/coinflip.context";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";

  protected Model: CoinFlipModel = new CoinFlipModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on(
      "coinflip:new",
      (cb: (serverSeedHash: string) => Promise<void>) => {
        let result = this.HandleGenerateServerSeed(socket.id);
        cb(result.sSeedHash);
      }
    );
    socket.on("coinflip:bet", (bet_data: z.infer<typeof CoinflipBetType>) => {
      this.HandleBetCreate(io, socket, bet_data);
    });
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
      account,
      this.CalculateMultiplier()
    );

    let session = this.Model.GetSession(session_id);

    session.ChangeStateEvent.RegisterEventListener(async (new_state) => {
      this.HandleStateChange(new_state, socket, session);
    });
  }
  public HandleStateChange(
    new_state: TSessionState,
    socket: Socket,
    session: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
    switch (new_state) {
      case "GAME_SETTLE":
        socket.once(COINFLIP_CHOICE, (option: "HEADS" | "TAILS") => {
          session.SessionContext.OnClientOptionSelect.Raise(option);
        });
        break;
      case "BET_SETTLE":
        socket.once(COINFLIP_CASHOUT, () =>
          session.SessionContext.OnClientFullfillOptionSelected.Raise("CASHOUT")
        );
        socket.once(COINFLIP_CONTINUE, () =>
          session.SessionContext.OnClientFullfillOptionSelected.Raise(
            "CONTINUE"
          )
        );
    }
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

  public HandleGenerateServerSeed(socket_id: string) {
    let data = this.GenerateServerSeed();
    this.Model.AddNewSocketServerSeed(socket_id, data.sSeed, data.sSeedHash);
    return data;
  }
}

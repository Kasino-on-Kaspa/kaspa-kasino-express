global.WebSocket = require('ws'); 

import { AccountStoreInstance } from "@/index";
import { Service } from "@utils/service/service";
import { Socket, Server } from "socket.io";
import { WalletController } from "./wallet.controller";
import { Express } from "express";
import { EventBus } from "@utils/eventbus";

class WalletSocketService extends Service {
    private readonly WalletController: WalletController;

    constructor(io: Server, express: Express) {
      super(io, express);
      this.WalletController = new WalletController();
      this.WalletController.WalletBalanceUpdatedEvent.RegisterEventListener(async ({id, delta}) => {
        this.HandleWalletUpdated(id, delta);
      });
    }

    public override Handler(socket: Socket): void {
        socket.on("wallet:refresh", async () => {
            await this.HandleRefreshWallet(socket);
        });

        socket.on("wallet:withdraw", async (user_address: string, amount: string) => {
            await this.HandleWalletWithdraw(socket, user_address, amount);
        });
        
        this.HandleWalletBalanceUpdate(socket);
    }

    
    private async HandleRefreshWallet(socket: Socket) {
      await this.WalletController.updateWalletBalance(socket);
    }

    private async HandleWalletBalanceUpdate(socket: Socket) {
        let wallet = this.WalletController.GetWalletFromSocket(socket);

        wallet?.OnUpdate.RegisterEventListener(async (data) => {
          socket.emit("wallet:update",  data);
        })
    }
    
    private async HandleWalletWithdraw(socket: Socket,user_address: string, amount: string) {
      await this.WalletController.HandleWalletWithdraw(socket, user_address, BigInt(amount));
    }

    public override ServerEventsHandler(): void {
      EventBus.Instance.on("wallet:update", async ({id, delta, reason}) => {
        this.WalletController.HandleWalletUpdate(id, delta, reason);
      })
      EventBus.Instance.on("wallet:get_delta", async ({id, resolver}: {id: string, resolver: (delta: bigint) => void}) => {
        let delta = this.WalletController.GetWalletDelta(id);
        resolver(delta);
      })
    }

    private async HandleWalletUpdated(id: string, delta: bigint) {
      EventBus.Instance.emit("wallet:updated", {id: id, delta: delta});
    }
}


export function InitializeWalletSocketService(io: Server, express: Express) {
  return new WalletSocketService(io, express);
}
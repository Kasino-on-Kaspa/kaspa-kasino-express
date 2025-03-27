import { AccountStoreInstance } from "@/index";
import { Service } from "@utils/service/service";
import { Socket, Server } from "socket.io";
import { WalletController } from "./wallet.controller";

class WalletSocketService extends Service {
    private readonly WalletController: WalletController = new WalletController();

    public override Handler(socket: Socket): void {
        socket.on("wallet:refresh", async () => {
            await this.HandleRefreshWallet(socket);
        });

        socket.on("wallet:withdraw", async (user_address: string, amount: bigint) => {
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
    
    private async HandleWalletWithdraw(socket: Socket,user_address: string, amount: bigint) {
      await this.WalletController.HandleWalletWithdraw(socket, user_address, amount);
    }
}


export function InitializeWalletSocketService(io: Server) {
  return new WalletSocketService(io);
}
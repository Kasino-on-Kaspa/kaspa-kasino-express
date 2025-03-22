import { Server, Socket } from "socket.io";
import { Service } from "../../utils/service/service";
import { WalletService } from "./wallet.service";
import { AccountStoreInstance } from "../..";

const WalletServiceNamespace = "/wallet";

export class WalletSocketService extends Service {
  // Add rate limiting
  private lastUpdateTime: Record<string, number> = {};
  private readonly UPDATE_COOLDOWN_MS = 5000; // 5 seconds between updates

  public onWalletBalanceUpdate(socket: Socket, balance: bigint) {
    socket.emit("wallet:balance", {
      balance: balance.toString(),
      address: socket.data.user.address,
    });
  }

  public override Handler(socket: Socket): void {
    const account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    account.Balance.AddListener(async (balance) => {
      this.onWalletBalanceUpdate(socket, balance);
    });
    // Handle request to get wallet balance
    socket.on("wallet:getBalance", async () => {
      console.log("wallet:getBalance");
      try {
        const account = AccountStoreInstance.GetUserFromHandshake(socket.id);

        if (!account) {
          socket.emit("wallet:error", { message: "Unauthorized" });
          return;
        }

        const wallet = await WalletService.getUserWallet(
          socket.data.user.address
        );
        socket.emit("wallet:balance", {
          balance: BigInt(wallet.balance).toString(),
          address: wallet.walletAddress,
        });
      } catch (e) {
        console.error(e);
        socket.emit("wallet:error", {
          message:
            e instanceof Error ? e.message : "Failed to get wallet balance",
        });
      }
    });

    // Handle request to update wallet balance
    socket.on("wallet:updateBalance", async () => {
      try {
        const account = AccountStoreInstance.GetUserFromHandshake(socket.id);

        if (!account) {
          socket.emit("wallet:error", { message: "Unauthorized" });
          return;
        }

        // Rate limiting
        const now = Date.now();
        const lastUpdate = this.lastUpdateTime[socket.id] || 0;
        if (now - lastUpdate < this.UPDATE_COOLDOWN_MS) {
          socket.emit("wallet:error", {
            message: "Please wait before requesting another balance update",
          });
          return;
        }
        this.lastUpdateTime[socket.id] = now;

        // Get blockchain-verified balance using the service
        const result = await WalletService.updateWalletBalance(
          socket.data.user.address
        );

        // The account's balance has already been updated in the service
        // and listeners will be notified through the observable

        // Log the balance update
        console.log(
          `Balance updated for ${socket.data.user.address}: ${result!.balance}`
        );
      } catch (e) {
        console.error(e);
        socket.emit("wallet:error", {
          message:
            e instanceof Error ? e.message : "Failed to update wallet balance",
        });
      }
    });

    // Clean up rate limiting on disconnect
    socket.on("disconnect", () => {
      delete this.lastUpdateTime[socket.id];
    });
  }
}

export function InitializeWalletService(io: Server) {
  return new WalletSocketService(io, WalletServiceNamespace);
}

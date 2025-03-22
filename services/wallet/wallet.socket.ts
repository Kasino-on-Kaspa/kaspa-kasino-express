import { Server, Socket } from "socket.io";
import { Service } from "../../utils/service/service";
import { WalletService } from "./wallet.service";
import { AccountStoreInstance } from "../..";

const WalletServiceNamespace = "/";

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

  private setupBalanceListener(socket: Socket): void {
    const account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    account.Balance.AddListener(async (balance) => {
      this.onWalletBalanceUpdate(socket, balance);
    });
  }

  private async handleGetBalance(socket: Socket): Promise<void> {
    console.log("wallet:getBalance");
    try {
      const account = AccountStoreInstance.GetUserFromHandshake(socket.id);

      if (!account) {
        socket.emit("wallet:error", { message: "Unauthorized" });
        return;
      }

      const wallet = await WalletService.getUserWallet(account.Id);
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
  }

  private checkRateLimit(socket: Socket): boolean {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime[socket.id] || 0;
    if (now - lastUpdate < this.UPDATE_COOLDOWN_MS) {
      socket.emit("wallet:error", {
        message: "Please wait before requesting another balance update",
      });
      return false;
    }
    this.lastUpdateTime[socket.id] = now;
    return true;
  }

  private async handleUpdateBalance(socket: Socket): Promise<void> {
    try {
      const account = AccountStoreInstance.GetUserFromHandshake(socket.id);

      if (!account) {
        socket.emit("wallet:error", { message: "Unauthorized" });
        return;
      }

      if (!this.checkRateLimit(socket)) {
        return;
      }

      // Get blockchain-verified balance using the service
      const result = await WalletService.updateWalletBalance(
        account.Id
      );

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
  }

  private handleDisconnect(socket: Socket): void {
    delete this.lastUpdateTime[socket.id];
  }

  public override Handler(socket: Socket): void {
    this.setupBalanceListener(socket);
    
    // Set up event handlers
    socket.on("wallet:getBalance", () => this.handleGetBalance(socket));
    socket.on("wallet:updateBalance", () => this.handleUpdateBalance(socket));
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }
}

export function InitializeWalletService(io: Server) {
  return new WalletSocketService(io, WalletServiceNamespace);
}

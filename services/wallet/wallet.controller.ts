import { Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { WalletService } from "./wallet.service";

export class WalletController {
	// Add rate limiting
	private lastUpdateTime: Record<string, number> = {};
	private readonly UPDATE_COOLDOWN_MS = 5000; // 5 seconds between updates

	updateWalletBalance = async (req: AuthenticatedRequest, res: Response) => {
		try {
			const address = req.user?.address;
			if (!address) {
				res.status(401).json({ message: "Unauthorized" });
				return;
			}
			
			// Rate limiting
			const now = Date.now();
			const lastUpdate = this.lastUpdateTime[address] || 0;
			if (now - lastUpdate < this.UPDATE_COOLDOWN_MS) {
				res.status(429).json({ message: "Please wait before requesting another balance update" });
				return;
			}
			this.lastUpdateTime[address] = now;

			const result = await WalletService.updateWalletBalance(address);
			
			// Log the balance update
			console.log(`Balance updated for ${address}: ${result.balance}`);
			
			res.status(200).json(result);
		} catch (e) {
			console.error(e);
			if (e instanceof Error && e.message === "Wallet not found") {
				res.status(404).json({ message: e.message });
			} else {
				res.status(500).json({ message: "Failed to update wallet balance" });
			}
		}
	};

	getWalletBalance = async (req: AuthenticatedRequest, res: Response) => {
		try {
			const address = req.user?.address;
			if (!address) {
				res.status(401).json({ message: "Unauthorized" });
				return;
			}

			const wallet = await WalletService.getUserWallet(address);
			res.status(200).json({ 
				balance: wallet.balance,
				address: wallet.walletAddress
			});
		} catch (e) {
			console.error(e);
			if (e instanceof Error && e.message === "Wallet not found") {
				res.status(404).json({ message: e.message });
			} else {
				res.status(500).json({ message: "Failed to get wallet balance" });
			}
		}
	};
}

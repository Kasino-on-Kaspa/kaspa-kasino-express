import { Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { WalletService } from "./wallet.service";

export class WalletController {
	updateWalletBalance = async (req: AuthenticatedRequest, res: Response) => {
		try {
			const address = req.user?.address;
			if (!address) {
				res.status(401).json({ message: "Unauthorized" });
				return;
			}

			const result = await WalletService.updateWalletBalance(address);
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

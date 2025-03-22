import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { authenticateJWT as authMiddleware } from "../auth/auth.middleware";

const walletRouter = Router();
const walletController = new WalletController();

// Route to get the current wallet balance
walletRouter.get("/balance", authMiddleware, walletController.getWalletBalance);

// Route to update the wallet balance
walletRouter.post(
  "/balance/update",
  authMiddleware,
  walletController.updateWalletBalance
);

// Route to get the deposit wallet
walletRouter.post(
  "/deposit",
  authMiddleware,
  walletController.getDepositWallet
);
export { walletRouter };

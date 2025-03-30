import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import authRoutes from "./services/auth/auth.routes";
import userRoutes from "./services/user/user.routes";
import {
  socketAuthMiddleware,
  TAuthenticatedSocket,
} from "./services/auth/socket.middleware";
import { AccountStore } from "./services/user/entities/accounts";

import bodyParser from "body-parser";
import { InstantiateServices } from "./services";
import { WalletDBQueueHandler } from "@utils/queue-manager/wallet-updater";
import { WithdrawalQueue } from "@utils/withdrawal/withdrawal-queue";
import { kaspaToSompi, Keypair, NetworkType } from "@kcoin/kaspa-web3.js";

const cors = require("cors");

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 2000,
  pingTimeout: 5000,
});

export const WalletDBQueueInstance = new WalletDBQueueHandler();

export const AccountStoreInstance = new AccountStore(io, WalletDBQueueInstance);

WalletDBQueueInstance.InstantiateProcessQueueTimer();

process.on("SIGINT", () => {
  WalletDBQueueInstance.ClearProcessQueueTimer();
  process.exit(0);
});

const a1 = "kaspatest:qqyhh7ryudnqu3xk44xy5agxtp4ce7jfktad95uws3vcqdu0v9t8kjtra6z87"
const a2 = "kaspatest:qzzf2jv7v6a6fgz3etlc23527cktel99l7c34xfwl9nue34c4q292fqzvgkzk"

// Apply socket authentication middleware
io.use(socketAuthMiddleware);
InstantiateServices(io, app);

io.on("connection", async (socket: TAuthenticatedSocket) => {
  console.log(`User connected: ${socket.data.user.address}`);
});

process.on("SIGINT", () => {
  process.exit(0);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

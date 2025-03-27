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

import { walletRouter } from "./services/wallet/wallet.routes";
import bodyParser from "body-parser";
import { InstantiateServices } from "./services";
import { WithdrawalQueue } from "@utils/withdrawal/withdrawal-queue";

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
app.use("/wallet", walletRouter);

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

export const AccountStoreInstance = new AccountStore(io);


// Apply socket authentication middleware
io.use(socketAuthMiddleware);
InstantiateServices(io);

io.on("connection", async (socket: TAuthenticatedSocket) => {
  console.log(`User connected: ${socket.data.user.address}`);
  
  await AccountStoreInstance.AddUserHandshake(socket, socket.data.user.id);

  socket.on("disconnect", async () => {
    await AccountStoreInstance.RemoveUserHandshake(socket);
    console.log(`User disconnected: ${socket.data.user.address}`);
  });
  
});
AccountStoreInstance.InstantiateDatabaseTimer(10000);

process.on("SIGINT", () => {
  AccountStoreInstance.DestroyDatabaseTimer();
  process.exit(0);
});

// !!! TESTING !!!
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

WithdrawalQueue.Instance.add("kaspatest:qqn5gqeu9amsc53gwzxl5xa237x3g8fk5h9hfay826936hhjvcjgg9gnesyap", BigInt(1_0000000_00), "04372ef8-b263-4e22-8242-106b4f8c2ca1")
WithdrawalQueue.Instance.add("kaspatest:qzmd9mxy2vlv74wkhr3wenkl9dtj75qzuyp6anxlnpvrzxjrq2205rq4f4t0r", BigInt(1_0000000_00), "04372ef8-b263-4e22-8242-106b4f8c2ca1")
WithdrawalQueue.Instance.add("kaspatest:qqyhh7ryudnqu3xk44xy5agxtp4ce7jfktad95uws3vcqdu0v9t8kjtra6z87", BigInt(1_0000000_00), "04372ef8-b263-4e22-8242-106b4f8c2ca1")
WithdrawalQueue.Instance.add("kaspatest:qzzf2jv7v6a6fgz3etlc23527cktel99l7c34xfwl9nue34c4q292fqzvgkzk", BigInt(1_0000000_00), "04372ef8-b263-4e22-8242-106b4f8c2ca1")

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

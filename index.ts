import express from "express";
import { createServer } from "node:http";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import { ServiceRegistry } from "./utils/service/handler-registry";
import { InitializeGameServices } from "./services/games";
import authRoutes from "./services/auth/auth.routes";
import userRoutes from "./services/user/user.routes";
import {
  socketAuthMiddleware,
  TAuthenticatedSocket,
} from "./services/auth/socket.middleware";
import { AccountStore } from "./services/user/entities/accounts";
import { WalletSocketService } from "./services/wallet/wallet.socket";

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

export const ServiceRegistryInstance = new ServiceRegistry();

InitializeGameServices(ServiceRegistryInstance);

ServiceRegistryInstance.RegisterService(new WalletSocketService());

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 2000,
  pingTimeout: 5000,
});

export const AccountStoreInstance = new AccountStore();

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

io.on("connection", async (socket: TAuthenticatedSocket) => {
  console.log(`User connected: ${socket.data.user.address}`);

  await AccountStoreInstance.AddUserHandshake(socket.id, socket.data.user.id);

  ServiceRegistryInstance.OnNewConnection(io, socket);

  socket.on("disconnect", async () => {
    await AccountStoreInstance.RemoveUserHandshake(socket.id);
    console.log(`User disconnected: ${socket.data.user.address}`);
  });
});

AccountStoreInstance.InstantiateDatabaseTimer(10000); // i think this is 10 seconds

// Add a shutdown handler
process.on("SIGINT", () => {
  AccountStoreInstance.DestroyDatabaseTimer();
  process.exit(0);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

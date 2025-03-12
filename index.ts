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
import { AccountStore } from "./services/auth/entities/accounts";

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

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const AccountStoreInstance = new AccountStore();

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

io.on("connection", async (socket: TAuthenticatedSocket) => {
  console.log(`User connected: ${socket.data.user.address}`);

  AccountStoreInstance.AddUserHandshake(socket.id, socket.data.user.id);
  

  ServiceRegistryInstance.OnNewConnection(io, socket);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.user.address}`);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

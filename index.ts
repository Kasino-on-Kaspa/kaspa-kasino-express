import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { ServiceRegistry } from "./utils/service/handler-registry";
import { InitializeGameServices } from "./services/games";
import authRoutes from "./services/auth/auth.routes";
import userRoutes from "./services/user/user.routes";

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

const io = new Server(server);

io.on("connection", (socket) => {
  ServiceRegistryInstance.OnNewConnection(io, socket);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { ServiceRegistry } from "./utils/service/handler-registry";
import { InitializeGameServices } from "./services/games";

const app = express();
const server = createServer(app);

export const ServiceRegistryInstance = new ServiceRegistry();

InitializeGameServices(ServiceRegistryInstance)

const io = new Server(server);

io.on("connection", (socket) => {
  ServiceRegistryInstance.OnNewConnection(io, socket);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

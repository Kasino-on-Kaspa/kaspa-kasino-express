import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { HandlerRegistry } from "./utils/service/handler-registry";
import { InitializeHandlers } from "./services";

const app = express();
const server = createServer(app);

const io = new Server(server);

io.on("connection", (socket) =>
	HandlerRegistry.Instance.OnNewConnection(io, socket)
);

InitializeHandlers();

server.listen(3000, () => {
	console.log("server running at http://localhost:3000");
});

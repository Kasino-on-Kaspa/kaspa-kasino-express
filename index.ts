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
import { AuthorizedServices, UnauthorizedServices } from "./services";

import { Accumulator } from "@utils/withdrawal/accumulator";

const cors = require("cors");

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
		exposedHeaders: ["Content-Type", "Authorization"],
	})
);
app.use(bodyParser.json());
// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

const io = new Server(server, {
	cors: {
		origin: true,
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
	pingInterval: 2000,
	pingTimeout: 5000,
});

export const AccountStoreInstance = new AccountStore(io);

Accumulator.Instance.startAccumulation(30000);
console.log("Accumulator started");

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

AuthorizedServices(io, app);
UnauthorizedServices(io, app);

io.on("connection", async (socket: TAuthenticatedSocket) => {
	console.log(`User connected: ${socket.data.user.address}`);
});

process.on("SIGINT", () => {
	process.exit(0);
});

server.listen(3000, () => {
	console.log("server running at http://localhost:3000");
});

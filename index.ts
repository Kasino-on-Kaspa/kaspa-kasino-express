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

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

const io = new Server(server, {
	pingInterval: 2000,
	pingTimeout: 5000,
});

export const AccountStoreInstance = new AccountStore(io);

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

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

server.listen(3000, () => {
	console.log("server running at http://localhost:3000");
});

import { Server, Socket } from "socket.io";

export type TSocketMessageListenerParams = {
	io: Server;
	socket: Socket;
	[args: string]: any;
};

export type TSocketMessageListener = (
	io: TSocketMessageListenerParams["io"],
	socket: TSocketMessageListenerParams["socket"],
	args: Omit<TSocketMessageListenerParams, "io" | "socket">
) => void;

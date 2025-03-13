import { Socket } from "socket.io";

interface IAuthenticatedSocketData {
	user: {
		id: string;
		address: string;
		xOnlyPublicKey: string;
		wallet: string;
		balance: number;
		username: string | null;
	};
}

// Client to server events (what the server listens for)
interface ClientToServerEvents {
	"wallet:getBalance": () => void;
	"wallet:updateBalance": () => void;
	"dieroll:bet": (bet_data: any) => void;
	disconnect: () => void;
}

// Server to client events (what the server emits)
interface ServerToClientEvents {
	"wallet:balance": (data: { balance: string; address: string }) => void;
	"wallet:error": (data: { message: string }) => void;
	"dieroll:error": (data: { message: string; error?: any }) => void;
	"dieroll:result": (data: any) => void;
}



export type TAuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  IAuthenticatedSocketData
>;
import { Socket } from "socket.io";

export interface IAuthenticatedSocketData {
	user: {
		id: string;
		address: string;
		xOnlyPublicKey: string;
		wallet: string;
		balance: bigint;
		username: string | null;
	};
}

// Base bet type structure
export interface BaseBetData {
  client_seed: string;
  amount: string;
}

// Die roll specific bet data
export interface DieRollBetData extends BaseBetData {
  target: number;
  condition: "OVER" | "UNDER";
}

// Zod validation error structure
export interface ZodIssue {
  code: string;
  expected: string;
  received: string;
  path: (string | number)[];
  message: string;
}

// Client to server events (what the server listens for)
export interface ClientToServerEvents {
	"wallet:getBalance": () => void;
	"wallet:updateBalance": () => void;
	"dieroll:bet": (bet_data: DieRollBetData) => void;
	"dieroll:predict": (callback: (serverSeedHash: string) => Promise<void>) => void;
	disconnect: () => void;
}

// Server to client events (what the server emits)
export interface ServerToClientEvents {
	"wallet:balance": (data: { balance: string; address: string }) => void;
	"wallet:error": (data: { message: string }) => void;
	"dieroll:error": (data: { message: string; error?: ZodIssue[] }) => void;
	"dieroll:result": (data: { resultRoll: number; isWon: boolean }) => void;
	"dieroll:fullfilled": (data: { 
		sessionId: string;
		serverSeed: string;
		serverSeedHash: string;
		clientSeed: string;
		betAmount: string;
		payout: string;
		multiplier: number;
		resultRoll: number;
		isWon: boolean;
	}) => void;
}


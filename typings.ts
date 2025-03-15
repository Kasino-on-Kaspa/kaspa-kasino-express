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

// Coinflip specific bet data
export interface CoinflipBetData extends BaseBetData {
  choice: "HEADS" | "TAILS";
}

// Zod validation error structure
export interface ZodIssue {
  code: string;
  expected: string;
  received: string;
  path: (string | number)[];
  message: string;
}

// Previous game data structure
export interface PreviousGameData {
  id: string;
  session: {
    id: string;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    amount: bigint;
    user: string;
    gameType: "DICEROLL" | "COINFLIP";
    createdAt: Date;
  };
  result: "HEADS" | "TAILS";
  level: number;
  multiplier: number;
  account: string;
}

// Client to server events (what the server listens for)
export interface ClientToServerEvents {
	// Wallet events
	"wallet:getBalance": () => void;
	"wallet:updateBalance": () => void;
	
	// Dieroll events
	"dieroll:bet": (bet_data: DieRollBetData) => void;
	"dieroll:predict": (callback: (serverSeedHash: string) => Promise<void>) => void;
	"dieroll:new": (callback: (serverSeedHash: string) => Promise<void>) => void;
	
	// Coinflip events
	"coinflip:bet": (bet_data: CoinflipBetData) => void;
	"coinflip:new": (callback: (serverSeedHash: string) => Promise<void>) => void;
	"coinflip:choice": (option: "HEADS" | "TAILS") => void;
	"coinflip:next": (option: "CASHOUT" | "CONTINUE") => void;
	"coinflip:get_previousGames": (callback: (prvsGame: PreviousGameData[], currentGame?: PreviousGameData) => Promise<void>) => void;
	
	// Socket events
	disconnect: () => void;
}

// Server to client events (what the server emits)
export interface ServerToClientEvents {
	// Wallet events
	"wallet:balance": (data: { balance: string; address: string }) => void;
	"wallet:error": (data: { message: string }) => void;
	
	// Dieroll events
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
	
	// Coinflip events
	"coinflip:error": (data: { message: string; error?: ZodIssue[] }) => void;
	"coinflip:result": (data: { resultFlip: "HEADS" | "TAILS"; isWon: boolean }) => void;
	"coinflip:fullfilled": (data: {
		server_seed: string;
		server_hash: string;
		sessionId?: string;
		clientSeed?: string;
		betAmount?: string;
		payout?: string;
		multiplier?: number;
		resultFlip?: "HEADS" | "TAILS";
		isWon?: boolean;
	}) => void;
}


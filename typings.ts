import { Socket } from "socket.io";
import { z } from "zod";
import { DieRollBetType } from "./services/games/dieroll/dieroll.types";
import { DieRollClientMessage } from "./services/games/dieroll/dieroll.messages";
import { PlaceBetPayload } from "./services/games/dieroll/dieroll.messages";
import { CoinFlipClientMessage } from "./services/games/coinflip/coinflip.messages";
import { DieRollServerMessage } from "./services/games/dieroll/dieroll.messages";
import { CoinFlipServerMessage } from "./services/games/coinflip/coinflip.messages";
import { AckFunction } from "./services/games/types";
import { TDierollBetResult } from "./services/games/dieroll/dieroll.types";

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
	[DieRollClientMessage.PLACE_BET]: (bet_data: z.infer<typeof DieRollBetType>) => void;
	[DieRollClientMessage.ROLL_DICE]: () => void;
	[DieRollClientMessage.LEAVE_GAME]: () => void;
	"dieroll:generate": (callback: (serverSeedHash: string) => void) => void;
	
	// Coinflip events
	[CoinFlipClientMessage.PLACE_BET]: (bet_data: PlaceBetPayload) => void;
	[CoinFlipClientMessage.FLIP_COIN]: () => void;
	[CoinFlipClientMessage.LEAVE_GAME]: () => void;
	"coinflip:session": (callback: (serverSeedHash: string, sessionId?: string) => void) => void;
	"coinflip:continue": (session_id: string, ack: AckFunction) => void;
	"coinflip:next": (session_id: string, option: "CASHOUT" | "CONTINUE", ack: AckFunction) => void;
	
	// Socket events
	disconnect: () => void;
}

// Server to client events (what the server emits)
export interface ServerToClientEvents {
	// Wallet events
	"wallet:balance": (data: { balance: string; address: string }) => void;
	"wallet:error": (data: { message: string }) => void;
	
	// Dieroll events
	[DieRollServerMessage.GAME_STATE]: (state: any) => void;
	[DieRollServerMessage.BET_PLACED]: (data: any) => void;
	[DieRollServerMessage.ROLL_RESULT]: (result: TDierollBetResult) => void;
	[DieRollServerMessage.ERROR]: (data: { message: string; error?: ZodIssue[] }) => void;
	[DieRollServerMessage.GAME_ENDED]: () => void;
	
	// Coinflip events
	[CoinFlipServerMessage.GAME_STATE]: (state: TSessionState) => void;
	[CoinFlipServerMessage.BET_PLACED]: (data: any) => void;
	[CoinFlipServerMessage.FLIP_RESULT]: (data: { resultFlip: "HEADS" | "TAILS"; isWon: boolean }) => void;
	[CoinFlipServerMessage.ERROR]: (data: { message: string; error?: ZodIssue[] }) => void;
	[CoinFlipServerMessage.GAME_ENDED]: () => void;
}


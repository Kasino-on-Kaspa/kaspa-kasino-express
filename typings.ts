import { CoinFlipClientMessage, CoinFlipServerMessage } from "./services/games/coinflip/coinflip.messages";
import { DieRollClientMessage,DieRollServerMessage } from "./services/games/dieroll/dieroll.messages";
import { User } from "./services/user/user.types";

// Socket data interface for authenticated sockets
export interface IAuthenticatedSocketData {
  user: User;
}

// Client to server events based on the codebase
export interface ClientToServerEvents {
  // Wallet events
  "wallet:updateBalance": () => void;
  
  // Coinflip events
  [CoinFlipClientMessage.GET_SESSION_SEED]: (callback: (serverSeedHash: string, sessionId?: string) => void) => void;
  [CoinFlipClientMessage.CREATE_BET]: (bet_data: any, ack: (response: { success: boolean; error?: string }) => void) => void;
  [CoinFlipClientMessage.FLIP_COIN]: (session_id: string, choice: "HEADS" | "TAILS", ack: (response: { success: boolean; error?: string }) => void) => void;
  [CoinFlipClientMessage.CONTINUE_BET]: (session_id: string, ack: (response: { success: boolean; error?: string }) => void) => void;
  [CoinFlipClientMessage.SESSION_NEXT]: (session_id: string, option: "CASHOUT" | "CONTINUE", ack: (response: { success: boolean; error?: string }) => void) => void;
  
  // Dieroll events
  [DieRollClientMessage.PLACE_BET]: (bet_data: any, ack: (response: { success: boolean; error?: string }) => void) => void;
  [DieRollClientMessage.GET_SESSION_SEEDS]: (callback: (serverSeedHash: string) => void) => void;
  
  // Default Socket.IO events
  disconnect: () => void;
}

// Server to client events based on the codebase
export interface ServerToClientEvents {
  // Wallet events
  "wallet:error": (data: { message: string }) => void;
  
  // Coinflip events
  [CoinFlipServerMessage.GAME_CHANGE_STATE]: (newState: any) => void;
  [CoinFlipServerMessage.FLIP_RESULT]: (data: { result: "HEADS" | "TAILS", client_won: boolean }) => void;
  [CoinFlipServerMessage.GAME_ENDED]: () => void;
  
  // Dieroll events
  [DieRollServerMessage.GAME_STATE]: (state: any) => void;
  [DieRollServerMessage.BET_PLACED]: (data: any) => void;
  [DieRollServerMessage.ROLL_RESULT]: (result: any) => void;
  [DieRollServerMessage.ERROR]: (error: any) => void;
  [DieRollServerMessage.GAME_ENDED]: () => void;
} 
// Client -> Server messages
export const enum CoinFlipClientMessage {
    PLACE_BET = 'coinflip:place_bet',
    FLIP_COIN = 'coinflip:flip_coin',
    LEAVE_GAME = 'coinflip:leave_game'
}

// Server -> Client messages
export const enum CoinFlipServerMessage {
    GAME_STATE = 'coinflip:game_state',
    BET_PLACED = 'coinflip:bet_placed',
    FLIP_RESULT = 'coinflip:flip_result',
    ERROR = 'coinflip:error',
    GAME_ENDED = 'coinflip:game_ended'
}

// Message payload types
export interface PlaceBetPayload {
    amount: number;
    prediction: 'HEADS' | 'TAILS';
}

export interface FlipResultPayload {
    result: 'HEADS' | 'TAILS';
    won: boolean;
    payout: number;
}

export interface GameStatePayload {
    gameId: string;
    currentBet?: number;
    prediction?: 'HEADS' | 'TAILS';
    phase: 'BETTING' | 'FLIPPING' | 'ENDED';
} 
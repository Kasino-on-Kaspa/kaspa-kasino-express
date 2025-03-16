// Client -> Server messages
export const enum DieRollClientMessage {
    PLACE_BET = 'dieroll:place_bet',
    ROLL_DICE = 'dieroll:roll_dice',
    LEAVE_GAME = 'dieroll:leave_game'
}

// Server -> Client messages
export const enum DieRollServerMessage {
    GAME_STATE = 'dieroll:game_state',
    BET_PLACED = 'dieroll:bet_placed',
    ROLL_RESULT = 'dieroll:roll_result',
    ERROR = 'dieroll:error',
    GAME_ENDED = 'dieroll:game_ended'
}

// Message payload types
export interface PlaceBetPayload {
    amount: number;
    prediction: number; // 1-6
}

export interface RollResultPayload {
    result: number;
    won: boolean;
    payout: number;
}

export interface GameStatePayload {
    gameId: string;
    currentBet?: number;
    prediction?: number;
    phase: 'BETTING' | 'ROLLING' | 'ENDED';
}

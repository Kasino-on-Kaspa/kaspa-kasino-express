// Client -> Server messages
export const enum DieRollClientMessage {
    GET_SESSION_SEEDS = 'dieroll:get_session_seeds',
    PLACE_BET = 'dieroll:place_bet'
}

// Server -> Client messages
export const enum DieRollServerMessage {
    ROLL_RESULT = 'dieroll:roll_result',
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

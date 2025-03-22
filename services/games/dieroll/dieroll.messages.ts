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

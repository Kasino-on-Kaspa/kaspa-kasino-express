// Client -> Server messages
export const enum CoinFlipClientMessage {
  GET_SESSION = "coinflip:get_session",
  CREATE_BET = "coinflip:create_bet",
  FLIP_COIN = "coinflip:flip_coin",
  CONTINUE_BET = "coinflip:continue_bet",
  SESSION_NEXT = "coinflip:session_next",
}

// Server -> Client messages
export const enum CoinFlipServerMessage {
  GAME_CHANGE_STATE = "coinflip:game_change_state",
  FLIP_RESULT = "coinflip:flip_result",
  GAME_ENDED = "coinflip:game_ended",
}
